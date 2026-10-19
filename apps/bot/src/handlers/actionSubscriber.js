import { pubsubSubscriber, ACTION_CHANNEL } from '../../../../packages/redis/src/queue.js';
import { EmbedBuilder } from 'discord.js';
import { createCase, sendModLog } from '../../../../packages/utils/moderation.js';
import { buildModEmbed } from '../../../../packages/utils/embedBuilder.js';
import {
  resolveAiActionPlan,
  resolveAiTimeoutMs,
  formatAiDuration,
} from '../../../../packages/systems/ai/aiModerationActions.js';

// Bounded retry policy for the boot-time subscribe. ioredis reconnects forever by
// default, so an unreachable Redis used to flood the log with 'connect ECONNREFUSED'
// and 'MaxRetriesPerRequestError' lines. We make a handful of subscribe attempts with
// exponential backoff, then disable the subscriber with a single warning instead.
const MAX_ATTEMPTS = 5;
const RETRY_DELAYS_MS = [2000, 4000, 8000, 16000, 32000]; // 2s, 4s, 8s, 16s, 32s
const MAX_RETRY_WINDOW_MS = 10000; // never hold the boot in retry state longer than this
const ATTEMPT_TIMEOUT_MS = 6000; // a single subscribe attempt must not hang forever

// Non-fatal problems are reported through the structured logger. Nothing in this
// module may log an error on the happy path: a failed sub-step (a deleted message
// that vanished on its own, a member that left, a database hiccup) must never
// abort the remaining enforcement steps nor the subscriber itself.
function logWarn(client, message) {
  if (client?.logger?.warn) client.logger.warn(message);
  else console.warn(message);
}

/**
 * The alert posted in the offending channel.
 *
 * The wording of the removal path is kept byte-for-byte identical to the
 * original implementation. When the message is NOT removed (a 'warn' keeps the
 * message) the first line states that instead of claiming a removal.
 */
function buildAlertEmbed(result, authorId, plan) {
  const headline = plan.deleteMessage
    ? `<@${authorId}>'s message was removed by the **Neural Moderation Engine**.`
    : `<@${authorId}>'s message was flagged by the **Neural Moderation Engine**${plan.caseType === 'warn' ? ' and a warning was issued.' : '.'}`;

  return new EmbedBuilder()
    .setColor('#ef4444')
    .setTitle('🛡️ Neural Moderation Alert')
    .setDescription(
      headline + '\n\n' +
      `**Category:** \`${result.category}\`\n` +
      `**Severity:** \`${result.severityScore}/100\`\n` +
      `**Reason:** ${result.reason}`
    )
    .setFooter({ text: 'Aura AI Shield (Gemini 1.5 Flash)' })
    .setTimestamp();
}

/**
 * Listens for enforcement actions dispatched by the AI Worker.
 *
 * Enforcement matrix (see packages/systems/ai/aiModerationActions.js):
 *   • 'delete'  -> message removed, case 'note'
 *   • 'timeout' -> message removed, 15m timeout, case 'timeout'
 *   • 'warn'    -> message KEPT, warning issued, case 'warn' (+ Warning row)
 *   • 'ban'     -> message removed, 15m timeout, case 'warn' — never auto-banned
 * Every applied action is recorded in the shared case system (createCase), so
 * AI moderation shows up in /case, /warnings, the dashboard and the mod log.
 */
export function initModerationActionSubscriber(client) {
  pubsubSubscriber.on('message', async (channel, messageData) => {
    if (channel !== ACTION_CHANNEL) return;

    let action;
    try {
      action = JSON.parse(messageData);
    } catch (err) {
      logWarn(client, `[Moderation] ignored malformed action payload: ${err?.message}`);
      return;
    }

    // Every enforcement step below is isolated: a single failing step must not
    // stop the remaining ones, and nothing may throw out of this callback.
    try {
      const { guildId, channelId, messageId, authorId, result } = action || {};
      if (!result?.flagged) return;

      const guild = await client.guilds.fetch(guildId).catch(() => null);
      if (!guild) return;

      const channelObj = await guild.channels.fetch(channelId).catch(() => null);
      if (!channelObj) return;

      const timeoutMs = await resolveAiTimeoutMs(client, guildId);
      const plan = resolveAiActionPlan(result, { timeoutMs });

      // 1) Delete the offending message (only the removing actions do this).
      if (plan.deleteMessage) {
        try {
          const targetMessage = await channelObj.messages.fetch(messageId).catch(() => null);
          if (targetMessage) await targetMessage.delete().catch(() => null);
        } catch (err) {
          logWarn(client, `[Moderation] could not delete message ${messageId}: ${err?.message}`);
        }
      }

      // 2) Send the warning alert
      try {
        await channelObj.send({ embeds: [buildAlertEmbed(result, authorId, plan)] });
      } catch (err) {
        logWarn(client, `[Moderation] could not post the alert in channel ${channelId}: ${err?.message}`);
      }

      // 3) Apply the timeout (recommended 'timeout'/'ban' or severity >= 80).
      if (plan.applyTimeout) {
        try {
          const member = await guild.members.fetch(authorId).catch(() => null);
          if (member && member.moderatable) {
            await member.timeout(plan.timeoutMs, `Neural Moderation: ${result.reason}`);
          }
        } catch (err) {
          logWarn(client, `[Moderation] could not time out ${authorId}: ${err?.message}`);
        }
      }

      // 4) Record the action in the shared case system. A 'warn' case also
      //    writes the Warning row; a failing case must never throw.
      let modCase = null;
      if (plan.caseType) {
        try {
          modCase = await createCase(client, {
            guildId,
            userId: authorId,
            moderatorId: client.user?.id || 'AURA_AI',
            type: plan.caseType,
            reason: plan.reason,
            duration: plan.caseDuration ?? undefined,
          });
          if (!modCase) {
            logWarn(client, `[Moderation] case for ${authorId} (${plan.caseType}) could not be recorded`);
          }
        } catch (err) {
          logWarn(client, `[Moderation] could not record the ${plan.caseType} case for ${authorId}: ${err?.message}`);
        }
      }

      // 5) Mirror the action into the guild moderation log channel.
      if (plan.caseType) {
        try {
          const target = await client.users.fetch(authorId).catch(() => null);
          await sendModLog(client, guildId, buildModEmbed({
            action: plan.caseType,
            user: target || authorId,
            moderator: client.user?.tag || client.user?.username || 'Aura AI',
            reason: plan.reason,
            caseId: modCase?.caseId,
            duration: plan.applyTimeout ? formatAiDuration(plan.timeoutMs) : undefined,
            extra: [
              { name: '🤖 AI Action', value: `\`${plan.action}\` (severity ${plan.severity}/100)`, inline: true },
              { name: '🗂️ Category', value: `\`${result.category || 'uncategorized'}\``, inline: true },
            ],
          }));
        } catch (err) {
          logWarn(client, `[Moderation] could not write the moderation log entry: ${err?.message}`);
        }
      }

      // 6) A 'ban' recommendation is never executed automatically — a human decides.
      if (plan.escalated) {
        logWarn(client, `⚠️ [Moderation] AI recommended a ban for <@${authorId}> in guild ${guildId} — no ban was applied, operator action required.`);
      }
    } catch (err) {
      logWarn(client, `[Moderation] failed to apply the AI moderation action: ${err?.message}`);
    }
  });

  subscribeWithBoundedRetry(client);
}

function subscribeWithBoundedRetry(client) {
  const startedAt = Date.now();
  const warn = (message) => {
    if (client?.logger?.warn) client.logger.warn(message);
    else console.warn(message);
  };

  // While retrying, take over ioredis' flood-prone reconnect loop: the temporary
  // retryStrategy makes each attempt a single dial, so a refused connection fails
  // fast and the backoff schedule above stays in charge. Both the error listeners
  // and the strategy are restored as soon as the outcome is known (subscribed or
  // disabled), so normal runtime reconnection behaviour is untouched.
  const defaultRetryStrategy = pubsubSubscriber.options.retryStrategy;
  const defaultErrorListeners = pubsubSubscriber.listeners('error');
  let lastConnectionError = null;
  let connectionErrorReported = false;
  const quietErrorLogger = (err) => {
    lastConnectionError = err?.message || String(err);
    if (!connectionErrorReported) {
      connectionErrorReported = true;
      console.warn('[Redis PubSub Sub]', lastConnectionError);
    }
  };

  pubsubSubscriber.removeAllListeners('error');
  pubsubSubscriber.on('error', quietErrorLogger);
  pubsubSubscriber.options.retryStrategy = () => null;

  let connectionSettingsRestored = false;
  const restoreConnectionSettings = () => {
    if (connectionSettingsRestored) return;
    connectionSettingsRestored = true;
    pubsubSubscriber.removeListener('error', quietErrorLogger);
    for (const listener of defaultErrorListeners) pubsubSubscriber.on('error', listener);
    pubsubSubscriber.options.retryStrategy = defaultRetryStrategy;
  };

  const attempt = (attemptNumber) => {
    let finished = false;
    let attemptTimer = null;

    const finish = (err) => {
      if (finished) return;
      finished = true;
      clearTimeout(attemptTimer);

      if (!err) {
        restoreConnectionSettings();
        console.log('📡 Subscribed to AI Moderation Action Channel.');
        return;
      }

      const nextDelay = RETRY_DELAYS_MS[attemptNumber - 1];
      const canRetry = attemptNumber < MAX_ATTEMPTS
        && typeof nextDelay === 'number'
        && Date.now() - startedAt + nextDelay <= MAX_RETRY_WINDOW_MS;

      if (!canRetry) {
        restoreConnectionSettings();
        warn(`[Moderation] action subscriber disabled — redis unavailable (last error: ${lastConnectionError || err.message})`);
        try { pubsubSubscriber.disconnect(); } catch { /* already closed */ }
        return;
      }

      warn(`❌ Failed to subscribe to moderation channel (attempt ${attemptNumber}/${MAX_ATTEMPTS}): ${err.message} — retrying in ${nextDelay / 1000}s`);
      const retryTimer = setTimeout(() => attempt(attemptNumber + 1), nextDelay);
      retryTimer.unref?.();
    };

    attemptTimer = setTimeout(
      () => finish(new Error(`subscribe attempt did not complete within ${ATTEMPT_TIMEOUT_MS / 1000}s`)),
      ATTEMPT_TIMEOUT_MS
    );
    attemptTimer.unref?.();

    try {
      pubsubSubscriber.connect().catch(() => {});
      pubsubSubscriber.subscribe(ACTION_CHANNEL, (err) => finish(err || null));
    } catch (err) {
      finish(err);
    }
  };

  attempt(1);
}

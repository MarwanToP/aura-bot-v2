import { pubsubSubscriber, ACTION_CHANNEL } from '../../../../packages/redis/src/queue.js';
import { EmbedBuilder } from 'discord.js';

// Bounded retry policy for the boot-time subscribe. ioredis reconnects forever by
// default, so an unreachable Redis used to flood the log with 'connect ECONNREFUSED'
// and 'MaxRetriesPerRequestError' lines. We make a handful of subscribe attempts with
// exponential backoff, then disable the subscriber with a single warning instead.
const MAX_ATTEMPTS = 5;
const RETRY_DELAYS_MS = [2000, 4000, 8000, 16000, 32000]; // 2s, 4s, 8s, 16s, 32s
const MAX_RETRY_WINDOW_MS = 10000; // never hold the boot in retry state longer than this
const ATTEMPT_TIMEOUT_MS = 6000; // a single subscribe attempt must not hang forever

/**
 * Listens for enforcement actions dispatched by the AI Worker.
 */
export function initModerationActionSubscriber(client) {
  pubsubSubscriber.on('message', async (channel, messageData) => {
    if (channel !== ACTION_CHANNEL) return;

    try {
      const action = JSON.parse(messageData);
      const { guildId, channelId, messageId, authorId, result } = action;

      if (!result.flagged) return;

      const guild = await client.guilds.fetch(guildId).catch(() => null);
      if (!guild) return;

      const channelObj = await guild.channels.fetch(channelId).catch(() => null);
      if (!channelObj) return;

      // Delete flagged message
      const targetMessage = await channelObj.messages.fetch(messageId).catch(() => null);
      if (targetMessage) await targetMessage.delete().catch(() => null);

      // Send warning alert
      const alertEmbed = new EmbedBuilder()
        .setColor('#ef4444')
        .setTitle('🛡️ Neural Moderation Alert')
        .setDescription(
          `<@${authorId}>'s message was removed by the **Neural Moderation Engine**.\n\n` +
          `**Category:** \`${result.category}\`\n` +
          `**Severity:** \`${result.severityScore}/100\`\n` +
          `**Reason:** ${result.reason}`
        )
        .setFooter({ text: 'Aura AI Shield (Gemini 1.5 Flash)' })
        .setTimestamp();

      await channelObj.send({ embeds: [alertEmbed] });

      // Apply timeout if high severity
      if (result.recommendedAction === 'timeout' || result.severityScore >= 80) {
        const member = await guild.members.fetch(authorId).catch(() => null);
        if (member && member.moderatable) {
          await member.timeout(15 * 60 * 1000, `Neural Moderation: ${result.reason}`);
        }
      }
    } catch (err) {
      console.error('❌ Error executing moderation action:', err);
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

// ================================================================
//  AURA BOT v2.0 — Background Tasks (All Cron Jobs)
// ================================================================

import { CronJob }           from 'cron';
import { awardVoiceXp }      from './leveling/levelingSystem.js';
import { checkBirthdays }    from './birthday/birthdaySystem.js';
import { endGiveaway }       from './giveaway/giveawaySystem.js';
import { checkSocialAlerts } from './socialAlerts/socialAlerts.js';
import logger                from '../utils/logger.js';

export function startBackgroundTasks(client) {
  logger.info('[Tasks] Starting background tasks...');

  // ── 1. Voice XP (every minute) ───────────────────────────
  new CronJob('* * * * *', async () => {
    for (const [key] of client.voiceSessions) {
      const [userId, guildId] = key.split(':');
      await awardVoiceXp(client, guildId, userId, 1).catch(() => {});
    }
  }, null, true);

  // ── 2. Birthday Check (every 15 min — each guild fires at its own local
  //        check hour, see checkBirthdays/birthdaySystem.js) ────────
  new CronJob('*/15 * * * *', async () => {
    await checkBirthdays(client);
  }, null, true);

  // ── 3. Social Alerts Check (every 5 minutes) ─────────────
  new CronJob('*/5 * * * *', async () => {
    await checkSocialAlerts(client).catch(e => logger.debug('[Social]', e.message));
  }, null, true);

  // ── 4. Stats Channel Updater (every 10 minutes) ──────────
  new CronJob('*/10 * * * *', async () => {
    await updateStatsChannels(client);
  }, null, true);

  // ── 5. Timed Messages (every minute) ─────────────────────
  new CronJob('* * * * *', async () => {
    await processTimedMessages(client);
  }, null, true);

  // ── 6. Giveaway Expiry Check (every minute) ───────────────
  new CronJob('* * * * *', async () => {
    await checkExpiredGiveaways(client);
  }, null, true);

  // ── 7. Ticket SLA Alerts (every 30 minutes) ──────────────
  new CronJob('*/30 * * * *', async () => {
    await checkTicketSLA(client);
  }, null, true);

  // ── 8. Temp Channel Cleanup + Reminders (every minute) ───
  new CronJob('* * * * *', async () => {
    await cleanupTempChannels(client);
    await processReminders(client);
  }, null, true);

  // ── 9. Log Cleanup (daily at 2 AM) ───────────────────────
  new CronJob('0 2 * * *', async () => {
    await cleanupOldLogs(client);
  }, null, true);

  // ── Voice Session Tracking ────────────────────────────────
  client.on('voiceStateUpdate', (oldState, newState) => {
    const member = newState.member || oldState.member;
    if (!member || member.user.bot) return;
    const guildId = (newState.guild || oldState.guild)?.id;
    const key     = `${member.id}:${guildId}`;

    if (!oldState.channelId && newState.channelId) {
      // Joined voice
      client.voiceSessions.set(key, Date.now());
    } else if (oldState.channelId && !newState.channelId) {
      // Left voice
      const joinedAt = client.voiceSessions.get(key);
      if (joinedAt) {
        const minutes = Math.floor((Date.now() - joinedAt) / 60000);
        if (minutes >= 1) awardVoiceXp(client, guildId, member.id, minutes).catch(() => {});
        client.voiceSessions.delete(key);
      }
    } else if (newState.channel?.id === newState.guild?.afkChannelId) {
      // Moved to AFK
      client.voiceSessions.delete(key);
    }
  });

  logger.info('[Tasks] All background tasks running ✓');
}

// ─── Stats Channels ───────────────────────────────────────────
export async function updateStatsChannels(client) {
  try {
    const { GuildSettings } = client.db.models;
    const guilds = await GuildSettings.findAll({ where: { statsEnabled: true } });

    for (const settings of guilds) {
      const guild = client.guilds.cache.get(settings.guildId);
      if (!guild) continue;

      if (settings.statsMemberChannelId) {
        const fmt = settings.statsMemberFormat || '👥 Members: {count}';
        const name = fmt.replace('{count}', guild.memberCount.toLocaleString());
        const ch = guild.channels.cache.get(settings.statsMemberChannelId);
        if (ch) await ch.setName(name).catch(() => {});
      }
      if (settings.statsOnlineChannelId) {
        const online = guild.members.cache.filter(m => m.presence?.status !== 'offline' && !m.user.bot).size;
        const fmt = settings.statsOnlineFormat || '🟢 Online: {count}';
        const name = fmt.replace('{count}', online.toLocaleString());
        const ch = guild.channels.cache.get(settings.statsOnlineChannelId);
        if (ch) await ch.setName(name).catch(() => {});
      }
      if (settings.statsBotChannelId) {
        const bots = guild.members.cache.filter(m => m.user.bot).size;
        const fmt = settings.statsBotFormat || '🤖 Bots: {count}';
        const name = fmt.replace('{count}', bots.toLocaleString());
        const ch = guild.channels.cache.get(settings.statsBotChannelId);
        if (ch) await ch.setName(name).catch(() => {});
      }
      if (settings.statsCustomChannelId) {
        const target = settings.customGoalTarget || 1000;
        const count = guild.memberCount;
        const fmt = settings.statsCustomFormat || '🎯 Goal: {count}/{target}';
        const name = fmt.replace('{count}', count.toLocaleString()).replace('{target}', target.toLocaleString());
        const ch = guild.channels.cache.get(settings.statsCustomChannelId);
        if (ch) await ch.setName(name).catch(() => {});
      }
    }
  } catch (err) {
    logger.warn('[Tasks] Stats channels:', err.message);
  }
}

// ─── Timed Messages ───────────────────────────────────────────
async function processTimedMessages(client) {
  try {
    const { TimedMessage } = client.db.models;
    const now  = new Date();
    const due  = await TimedMessage.findAll({ where: { enabled: true, nextSendAt: { [client.db.Op.lte]: now } } });

    for (const msg of due) {
      try {
        const channel = await client.channels.fetch(msg.channelId).catch(() => null);
        if (channel?.isTextBased()) {
          // The message body is user-authored — a stored "@everyone" must never
          // be able to ping the whole server.
          await channel.send({ content: msg.content, allowedMentions: { parse: [] } });
          const next = new Date(now.getTime() + msg.interval * 1000);
          await msg.update({ lastSentAt: now, nextSendAt: next });
        }
      } catch {}
    }
  } catch (err) {
    logger.debug('[Tasks] Timed messages:', err.message);
  }
}

// ─── Giveaway Expiry ──────────────────────────────────────────
async function checkExpiredGiveaways(client) {
  try {
    const { Giveaway } = client.db.models;
    const expired = await Giveaway.findAll({
      where: { active: true, endsAt: { [client.db.Op.lte]: new Date() } }
    });
    for (const gw of expired) {
      await endGiveaway(client, gw.id).catch(() => {});
    }
  } catch {}
}

// ─── Ticket SLA ───────────────────────────────────────────────
async function checkTicketSLA(client) {
  try {
    const { Ticket, GuildSettings } = client.db.models;
    const twoHrsAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const idle = await Ticket.findAll({ where: { status: ['open','claimed'], updatedAt: { [client.db.Op.lt]: twoHrsAgo } } });

    for (const ticket of idle) {
      try {
        const settings = await GuildSettings.findOne({ where: { guildId: ticket.guildId } });
        if (!settings?.ticketLogChannelId) continue;
        const channel = await client.channels.fetch(settings.ticketLogChannelId).catch(() => null);
        if (!channel?.isTextBased()) continue;

        const { buildEmbed } = await import('../utils/embedBuilder.js').catch(() => ({ buildEmbed: null }));
        if (!buildEmbed) continue;

        await channel.send({ embeds: [buildEmbed({ type: 'warning', title: '⚠️ SLA Warning', description: `Ticket **${ticket.ticketId}** idle >2hrs | Priority: ${ticket.priority} | <#${ticket.channelId}>` })] });
        await ticket.update({ updatedAt: new Date() });
      } catch {}
    }
  } catch {}
}

// ─── Temp Channel Cleanup ─────────────────────────────────────
async function cleanupTempChannels(client) {
  try {
    const { TempChannel } = client.db.models;
    if (!TempChannel) return;
    const now = new Date();

    // 1) Expired temp channels — delete the channel and drop the row (unchanged behaviour)
    const expired = await TempChannel.findAll({ where: { expiresAt: { [client.db.Op.lte]: now } } });

    for (const tc of expired) {
      try {
        const channel = await client.channels.fetch(tc.channelId).catch(() => null);
        if (channel) await channel.delete('[Aura] Temp channel expired').catch(() => {});
        await tc.destroy();
      } catch {}
    }

    // 2) Reaper for rows created without an expiry (voiceSystem creates TempChannel rows
    //    with expiresAt NULL, so a channel deleted while the bot was offline would leak
    //    its row forever). If the channel no longer exists → drop the row; if it is an
    //    empty voice channel → delete the channel and the row; if members are inside,
    //    leave the channel alone. Capped at 25 rows per pass to bound API calls.
    const orphans = await TempChannel.findAll({ where: { expiresAt: null }, limit: 25 });

    for (const tc of orphans) {
      try {
        let channel = null;
        try {
          channel = await client.channels.fetch(tc.channelId);
        } catch (err) {
          // Only a genuine "Unknown Channel" (Discord 10003 / HTTP 404) proves the
          // channel is gone → drop the row. Transient failures (network hiccups, bot
          // not connected yet) must NOT destroy the row — the next pass retries.
          if (err?.code === 10003 || err?.status === 404) await tc.destroy();
          continue;
        }
        if (!channel) {
          await tc.destroy();
          continue;
        }
        if (channel.isVoiceBased?.() && channel.members?.size === 0) {
          await channel.delete('[Aura] Orphaned temp channel removed').catch(() => {});
          await tc.destroy();
        }
      } catch {}
    }
  } catch {}
}

// ─── Reminders ────────────────────────────────────────────────
export async function processReminders(client) {
  try {
    const { Reminder } = client.db.models;
    if (!Reminder) return;
    const now = new Date();

    const due = await Reminder.findAll({
      where: { sent: false, remindAt: { [client.db.Op.lte]: now } },
      order: [['remindAt', 'ASC']],
      limit: 25,
    });

    for (const row of due) {
      try {
        let delivered = false;

        // Primary path: the channel the reminder was created in
        try {
          const channel = await client.channels.fetch(row.channelId);
          if (channel) {
            // The reminder body is user-authored: only the single user this
            // reminder belongs to may be mentioned, never @everyone/@here.
            await channel.send({
              content: `<@${row.userId}> ⏰ ${row.content}`,
              allowedMentions: { parse: [], users: [row.userId] },
            });
            delivered = true;
          }
        } catch {}

        // Fallback: channel deleted/inaccessible → DM the user instead
        if (!delivered) {
          try {
            const user = await client.users.fetch(row.userId);
            await user.send(`⏰ ${row.content}`);
            delivered = true;
          } catch {}
        }

        // Both paths failed (e.g. DMs closed + channel gone): still mark the row as sent
        // so the cron never retries it forever — a stuck row would block the batch's
        // limit-25 window for every future pass. The user can re-create the reminder.
        if (!delivered) {
          logger.warn(`[Tasks] Reminder #${row.id} undeliverable (user ${row.userId}, channel ${row.channelId}); marked as sent to prevent infinite retries.`);
        }
        await row.update({ sent: true });
      } catch (err) {
        logger.warn(`[Tasks] Reminder #${row.id} failed:`, err.message);
      }
    }

    // Purge delivered reminders older than 30 days (bounded to 100 rows per pass).
    const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const stale = await Reminder.findAll({
      where: { sent: true, remindAt: { [client.db.Op.lt]: cutoff } },
      attributes: ['id'],
      limit: 100,
    });
    if (stale.length) {
      await Reminder.destroy({ where: { id: { [client.db.Op.in]: stale.map(r => r.id) } } }).catch(() => {});
    }
  } catch (err) {
    logger.debug('[Tasks] Reminders:', err.message);
  }
}

// ─── Log Cleanup ─────────────────────────────────────────────
async function cleanupOldLogs(client) {
  try {
    const { ModerationCase } = client.db.models;
    const cutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const deleted = await ModerationCase.destroy({ where: { createdAt: { [client.db.Op.lt]: cutoff }, active: false } });
    if (deleted > 0) logger.info(`[Tasks] Cleaned ${deleted} old cases`);
  } catch {}
}

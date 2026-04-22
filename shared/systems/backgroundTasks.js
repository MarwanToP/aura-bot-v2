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

  // ── 2. Birthday Check (daily at 9 AM UTC) ────────────────
  new CronJob('0 9 * * *', async () => {
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

  // ── 8. Temp Channel Cleanup (every 5 minutes) ────────────
  new CronJob('*/5 * * * *', async () => {
    await cleanupTempChannels(client);
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
async function updateStatsChannels(client) {
  try {
    const { GuildSettings } = client.db.models;
    const guilds = await GuildSettings.findAll({ where: { statsEnabled: true } });

    for (const settings of guilds) {
      const guild = client.guilds.cache.get(settings.guildId);
      if (!guild) continue;

      if (settings.statsMemberChannelId) {
        const ch = guild.channels.cache.get(settings.statsMemberChannelId);
        if (ch) await ch.setName(`👥 Members: ${guild.memberCount.toLocaleString()}`).catch(() => {});
      }
      if (settings.statsOnlineChannelId) {
        const online = guild.members.cache.filter(m => m.presence?.status !== 'offline' && !m.user.bot).size;
        const ch = guild.channels.cache.get(settings.statsOnlineChannelId);
        if (ch) await ch.setName(`🟢 Online: ${online.toLocaleString()}`).catch(() => {});
      }
      if (settings.statsBotChannelId) {
        const bots = guild.members.cache.filter(m => m.user.bot).size;
        const ch = guild.channels.cache.get(settings.statsBotChannelId);
        if (ch) await ch.setName(`🤖 Bots: ${bots}`).catch(() => {});
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
          await channel.send(msg.content);
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
    if (!idle.length) return;

    // Optimization: Fetch all unique GuildSettings in one query to avoid N+1
    const guildIds = [...new Set(idle.map(t => t.guildId))];
    const allSettings = await GuildSettings.findAll({ where: { guildId: { [client.db.Op.in]: guildIds } } });
    const settingsMap = new Map(allSettings.map(s => [s.guildId, s]));

    for (const ticket of idle) {
      try {
        const settings = settingsMap.get(ticket.guildId);
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
    const expired = await TempChannel.findAll({ where: { expiresAt: { [client.db.Op.lte]: new Date() } } });

    for (const tc of expired) {
      try {
        const channel = await client.channels.fetch(tc.channelId).catch(() => null);
        if (channel) await channel.delete('[Aura] Temp channel expired').catch(() => {});
        await tc.destroy();
      } catch {}
    }
  } catch {}
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

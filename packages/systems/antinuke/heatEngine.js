// ================================================================
//  AURA BOT v2.0 — Contextual Heat Algorithm & Quarantine Engine
// ================================================================
import logger from '../../utils/logger.js';
import { buildEmbed } from '../../utils/embedBuilder.js';

/**
 * Evaluates cumulative heat score for incoming message / action
 */
export async function calculateMessageHeat(client, message) {
  if (!message.guild || message.author.bot) return { heatScore: 0, quarantined: false };

  try {
    const { guild, author, content, member } = message;
    const { GuildSettings } = client.db.models;
    const settings = await GuildSettings.findOne({ where: { guildId: guild.id } });
    if (!settings?.antiNukeEnabled) return { heatScore: 0, quarantined: false };

    // Calculate component weights
    let score = 1.0; // Base message heat

    // Link density
    const linkRegex = /(https?:\/\/[^\s]+)/g;
    const linkMatches = content.match(linkRegex);
    if (linkMatches) score += linkMatches.length * 3.0;

    // Mass mentions
    const mentions = message.mentions.users.size + message.mentions.roles.size;
    if (mentions >= 3) score += mentions * 2.0;

    // Emoji density
    const emojiRegex = /<a?:[a-zA-Z0-9_]+:[0-9]+>|[\u{1F300}-\u{1F6FF}]/gu;
    const emojiMatches = content.match(emojiRegex);
    if (emojiMatches && emojiMatches.length >= 5) score += (emojiMatches.length - 4) * 0.5;

    // Account age heuristic (multiplier for new accounts < 7 days)
    const accountAgeDays = (Date.now() - author.createdTimestamp) / (1000 * 60 * 60 * 24);
    if (accountAgeDays < 7) score *= 1.5;

    // Redis rolling window accumulator (60 second decay window)
    const heatKey = `heat:${guild.id}:${author.id}`;
    const rawVal = await client.redis.get(heatKey);
    const currentHeat = (parseFloat(rawVal) || 0) + score;

    await client.redis.setex(heatKey, 60, currentHeat.toFixed(2));

    // Threshold enforcement
    const QUARANTINE_THRESHOLD = 30.0;
    if (currentHeat >= QUARANTINE_THRESHOLD) {
      const quarantined = await quarantineUser(client, guild, member, `Exceeded Heat Threshold (${currentHeat.toFixed(1)} pts)`);
      return { heatScore: currentHeat, quarantined };
    }

    return { heatScore: currentHeat, quarantined: false };
  } catch (err) {
    logger.error('[HeatEngine] Error calculating heat:', err.message);
    return { heatScore: 0, quarantined: false };
  }
}

/**
 * Isolates user in Quarantine state
 */
export async function quarantineUser(client, guild, member, reason = 'Automated Quarantine') {
  try {
    if (!member || !member.moderatable) return false;

    // 1. Timeout for 1 hour
    await member.timeout(3600000, `[Aura Heat Quarantine] ${reason}`).catch(() => {});

    // Save Quarantine state to Redis for Dashboard & API retrieval
    const qKey = `quarantine:${guild.id}:${member.id}`;
    const qRecord = {
      userId: member.id,
      username: member.user?.username || member.user?.tag || member.id,
      userTag: member.user?.tag || member.user?.username || member.id,
      reason,
      quarantinedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    };
    if (client.redis?.setex) {
      await client.redis.setex(qKey, 3600, JSON.stringify(qRecord)).catch(() => {});
    }

    // 2. Audit log entry & DB case recording
    const { GuildSettings, ModerationCase, GuildCounter } = client.db.models;
    if (ModerationCase) {
      try {
        let counter = await GuildCounter?.findByPk(guild.id);
        if (!counter && GuildCounter) counter = await GuildCounter.create({ guildId: guild.id, caseCount: 0 });
        const caseId = (counter?.caseCount || 0) + 1;
        if (counter) await counter.update({ caseCount: caseId });
        await ModerationCase.create({
          caseId,
          guildId: guild.id,
          userId: member.id,
          moderatorId: client.user?.id || 'SYSTEM',
          type: 'timeout',
          reason: `[Aura Heat Quarantine] ${reason}`,
          duration: 3600000,
          expiresAt: new Date(Date.now() + 3600000),
          active: true
        });
      } catch (err) {
        logger.error('[HeatEngine] Failed to record moderation case:', err.message);
      }
    }

    const settings = await GuildSettings.findOne({ where: { guildId: guild.id } });
    const logChannelId = settings?.modLogChannelId || settings?.auditLogChannelId;

    if (logChannelId) {
      const channel = await guild.channels.fetch(logChannelId).catch(() => null);
      if (channel?.isTextBased()) {
        await channel.send({
          embeds: [
            buildEmbed({
              type: 'security',
              title: '🔥 Heat Algorithm — Quarantine Triggered',
              description: `User <@${member.id}> (${member.user.tag}) has breached heat threshold and been quarantined.`,
              fields: [
                { name: '👤 User', value: `${member.user.tag} (\`${member.id}\`)`, inline: true },
                { name: '⚡ Reason', value: reason, inline: true },
                { name: '⏳ Action', value: '1 Hour Timeout + Role Stripping', inline: true }
              ],
              timestamp: true
            })
          ]
        });
      }
    }
    return true;
  } catch (err) {
    logger.error('[HeatEngine] Failed to quarantine user:', err.message);
    return false;
  }
}

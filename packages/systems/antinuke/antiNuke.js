// ================================================================
//  Anti-Nuke System v2
// ================================================================
import { AuditLogEvent } from 'discord.js';
import { buildEmbed }    from '../../utils/embedBuilder.js';
import config            from '../../config/config.js';
import logger            from '../../utils/logger.js';
export { calculateMessageHeat, quarantineUser } from './heatEngine.js';

export async function handleAntiNuke(client, guildId, executorId, actionType, details = {}) {
  try {
    const { GuildSettings } = client.db.models;
    const settings = await GuildSettings.findOne({ where: { guildId } });
    if (!settings?.antiNukeEnabled) return;

    if (config.owners.includes(executorId)) return;
    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild || guild.ownerId === executorId) return;

    const thresholds = {
      ban:            config.antiNuke.banThreshold,
      kick:           config.antiNuke.kickThreshold,
      channel_delete: config.antiNuke.channelDeleteThreshold,
      role_delete:    config.antiNuke.roleDeleteThreshold,
      webhook_create: config.antiNuke.webhookCreateThreshold,
    };
    const threshold = thresholds[actionType];
    if (!threshold) return;

    const key = `antinuke:${guildId}:${executorId}:${actionType}`;
    const { count, exceeded } = await client.redis.incrementBounded(key, threshold.count, threshold.window);
    if (!exceeded) return;

    const member = await guild.members.fetch(executorId).catch(() => null);
    if (!member) return;

    const punishment = await punish(guild, member);
    logger.warn(`[AntiNuke] ${guild.name}: ${member.user.tag} → ${actionType} (${count}x) → ${punishment}`);

    const channelId = settings.auditLogChannelId || settings.modLogChannelId;
    if (channelId) {
      const ch = await client.channels.fetch(channelId).catch(() => null);
      if (ch?.isTextBased()) {
        await ch.send({ embeds: [buildEmbed({
          type: 'security', title: '🛡️ Anti-Nuke Triggered',
          description: client.i18n.t('security.antiNuke.triggered', { user: `${member.user.tag} (${member.id})`, action: actionType }, settings.language),
          fields: [
            { name: '⚡ Action',     value: actionType,          inline: true },
            { name: '🔢 Count',      value: `${count}/${threshold.count}`, inline: true },
            { name: '⚖️ Punishment', value: punishment,          inline: true },
            ...(details.targetName ? [{ name: '🎯 Target', value: details.targetName, inline: true }] : []),
          ],
          timestamp: true,
        })] });
      }
    }
  } catch (err) { logger.error('[AntiNuke]', err.message); }
}

async function punish(guild, member) {
  if (guild.members.me.roles.highest.comparePositionTo(member.roles.highest) <= 0) return 'Failed: Higher Role';
  for (const p of config.antiNuke.punishments) {
    try {
      if (p === 'derank') { await member.roles.remove(member.roles.cache.filter(r => r.id !== guild.id), '[Aura Anti-Nuke]'); return 'Deranked'; }
      if (p === 'timeout' && member.moderatable) { await member.timeout(86400000, '[Aura Anti-Nuke]'); return 'Timeout 24h'; }
      if (p === 'kick' && member.kickable) { await member.kick('[Aura Anti-Nuke]'); return 'Kicked'; }
      if (p === 'ban') { await guild.members.ban(member.id, { reason: '[Aura Anti-Nuke]' }); return 'Banned'; }
    } catch {}
  }
  return 'None';
}

export async function onChannelDelete(client, channel) {
  if (!channel.guild) return;
  try {
    await new Promise(r => setTimeout(r, 1000));
    const logs  = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete, limit: 1 });
    const entry = logs.entries.first();
    if (!entry || Date.now() - entry.createdTimestamp > 5000) return;
    await handleAntiNuke(client, channel.guild.id, entry.executor.id, 'channel_delete', { targetName: channel.name });
  } catch {}
}

export async function onRoleDelete(client, role) {
  if (!role.guild) return;
  try {
    await new Promise(r => setTimeout(r, 1000));
    const logs  = await role.guild.fetchAuditLogs({ type: AuditLogEvent.RoleDelete, limit: 1 });
    const entry = logs.entries.first();
    if (!entry || Date.now() - entry.createdTimestamp > 5000) return;
    await handleAntiNuke(client, role.guild.id, entry.executor.id, 'role_delete', { targetName: role.name });
  } catch {}
}

export async function onGuildBanAdd(client, ban) {
  try {
    await new Promise(r => setTimeout(r, 1000));
    const logs  = await ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 1 });
    const entry = logs.entries.first();
    if (!entry || Date.now() - entry.createdTimestamp > 5000 || entry.executor.id === client.user.id) return;
    await handleAntiNuke(client, ban.guild.id, entry.executor.id, 'ban', { targetName: ban.user.tag });
  } catch {}
}

export async function onWebhookUpdate(client, channel) {
  if (!channel?.guild) return;
  try {
    await new Promise(r => setTimeout(r, 1000));
    const logs = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.WebhookCreate, limit: 1 });
    const entry = logs.entries.first();
    if (!entry || Date.now() - entry.createdTimestamp > 5000 || entry.executor?.id === client.user?.id) return;
    await handleAntiNuke(client, channel.guild.id, entry.executor.id, 'webhook_create', {
      targetName: entry.target?.name || channel.name || 'webhook'
    });
  } catch {}
}

export async function onGuildMemberRemove(client, member) {
  try {
    await new Promise(r => setTimeout(r, 1000));
    const logs  = await member.guild.fetchAuditLogs({ type: AuditLogEvent.MemberKick, limit: 1 });
    const entry = logs.entries.first();
    if (!entry || entry.target?.id !== member.id || Date.now() - entry.createdTimestamp > 5000 || entry.executor.id === client.user.id) return;
    await handleAntiNuke(client, member.guild.id, entry.executor.id, 'kick', { targetName: member.user.tag });
  } catch {}
}

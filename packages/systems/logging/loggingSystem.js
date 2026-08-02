// ================================================================
//  Logging System v2 — Comprehensive Audit Logs
// ================================================================
import { EmbedBuilder } from 'discord.js';
import config           from '../../config/config.js';
import logger           from '../../utils/logger.js';

async function getCh(client, guildId) {
  try {
    const cached = await client.redis.get(`logchan:${guildId}`);
    if (cached === 'null') return null;
    if (cached) return client.channels.cache.get(cached) || client.channels.fetch(cached).catch(() => null);
    const { GuildSettings } = client.db.models;
    const s  = await GuildSettings.findOne({ where: { guildId } });
    const id = s?.auditLogChannelId;
    await client.redis.setex(`logchan:${guildId}`, 300, id || 'null');
    return id ? client.channels.fetch(id).catch(() => null) : null;
  } catch { return null; }
}

async function send(client, guildId, embed) {
  const ch = await getCh(client, guildId);
  if (ch?.isTextBased()) await ch.send({ embeds: [embed] }).catch(() => {});
}

function e({ color, title, fields = [], footer, description }) {
  const emb = new EmbedBuilder().setColor(color || config.colors.info).setTitle(title).setTimestamp();
  if (description) emb.setDescription(description);
  if (footer) emb.setFooter({ text: footer });
  if (fields.length) emb.addFields(fields);
  return emb;
}

export const logMessageDelete  = (c, m) => !m.guild || m.author?.bot ? null :
  send(c, m.guild.id, e({ color: 0xFF4444, title: '🗑️ Message Deleted', fields: [
    { name: '👤 Author', value: `<@${m.author?.id}> (${m.author?.tag})`, inline: true },
    { name: '📢 Channel', value: `<#${m.channel.id}>`, inline: true },
    { name: '📝 Content', value: m.content?.slice(0,1000) || '[No text]', inline: false },
  ], footer: `ID: ${m.id}` }));

export const logMessageEdit    = (c, o, n) => !n.guild || n.author?.bot || o.content === n.content ? null :
  send(c, n.guild.id, e({ color: 0xFFBB33, title: '✏️ Message Edited', fields: [
    { name: '👤 Author', value: `<@${n.author.id}>`, inline: true },
    { name: '📢 Channel', value: `<#${n.channel.id}>`, inline: true },
    { name: '📝 Before', value: (o.content||'[empty]').slice(0,500), inline: false },
    { name: '✅ After', value: (n.content||'[empty]').slice(0,500), inline: false },
  ] }));

export const logGhostPing      = (c, m, mentions) => {
  if (!m.guild) return;
  const mentioned = [...(mentions.users?.values?.() || [])].map(u => `<@${u.id}>`).join(', ') || 'role(s)';
  return send(c, m.guildId, e({ color: 0xEB459E, title: '👻 Ghost Ping Detected', fields: [
    { name: '👤 Sender', value: `<@${m.author?.id}>`, inline: true },
    { name: '📢 Channel', value: `<#${m.channelId}>`, inline: true },
    { name: '🔔 Pinged', value: mentioned, inline: true },
    { name: '📝 Content', value: m.content?.slice(0,500) || '[deleted]', inline: false },
  ] }));
};

export const logMemberJoin     = (c, m) => {
  const age = Math.floor((Date.now() - m.user.createdTimestamp) / 86400000);
  return send(c, m.guild.id, e({ color: 0x00C851, title: '📥 Member Joined', fields: [
    { name: '👤 User', value: `<@${m.id}> (${m.user.tag})`, inline: true },
    { name: '📅 Acct Age', value: `${age} days${age < 7 ? ' ⚠️' : ''}`, inline: true },
    { name: '👥 Member #', value: `${m.guild.memberCount}`, inline: true },
  ], footer: `ID: ${m.id}` }));
};

export const logMemberLeave    = (c, m) =>
  send(c, m.guild.id, e({ color: 0xFF4444, title: '📤 Member Left', fields: [
    { name: '👤 User', value: `${m.user.tag}`, inline: true },
    { name: '🎭 Roles', value: m.roles.cache.filter(r => r.id !== m.guild.id).map(r => `<@&${r.id}>`).join(' ').slice(0,500) || 'None', inline: false },
  ], footer: `ID: ${m.id}` }));

export const logMemberUpdate   = (c, o, n) => {
  const changes = [];
  if (o.nickname !== n.nickname) changes.push({ name: '📝 Nickname', value: `**Before:** ${o.nickname||'None'}\n**After:** ${n.nickname||'None'}`, inline: false });
  const added   = n.roles.cache.filter(r => !o.roles.cache.has(r.id));
  const removed = o.roles.cache.filter(r => !n.roles.cache.has(r.id));
  if (added.size)   changes.push({ name: '➕ Roles Added',   value: added.map(r=>`<@&${r.id}>`).join(' '),   inline: true });
  if (removed.size) changes.push({ name: '➖ Roles Removed', value: removed.map(r=>`<@&${r.id}>`).join(' '), inline: true });
  if (!changes.length) return;
  return send(c, n.guild.id, e({ color: 0x33B5E5, title: '✏️ Member Updated', fields: [{ name: '👤 User', value: `<@${n.id}>`, inline: true }, ...changes], footer: `ID: ${n.id}` }));
};

export const logVoiceUpdate    = (c, o, n) => {
  const m = n.member || o.member;
  if (!m || m.user.bot) return;
  if (!o.channelId && n.channelId) return send(c, n.guild.id, e({ color: 0x00C851, title: '🔊 Voice Joined', fields: [{ name: '👤', value: `<@${m.id}>`, inline: true }, { name: '📢', value: `<#${n.channelId}>`, inline: true }] }));
  if (o.channelId && !n.channelId) return send(c, o.guild.id, e({ color: 0xFF4444, title: '🔇 Voice Left',   fields: [{ name: '👤', value: `<@${m.id}>`, inline: true }, { name: '📢', value: `<#${o.channelId}>`, inline: true }] }));
  if (o.channelId !== n.channelId) return send(c, n.guild.id, e({ color: 0xFFBB33, title: '➡️ Voice Moved',  fields: [{ name: '👤', value: `<@${m.id}>`, inline: true }, { name: '⬅️ From', value: `<#${o.channelId}>`, inline: true }, { name: '➡️ To', value: `<#${n.channelId}>`, inline: true }] }));
};

export const logChannelCreate  = (c, ch) => !ch.guild ? null : send(c, ch.guild.id, e({ color: 0x00C851, title: '📢 Channel Created', fields: [{ name: '📢', value: `<#${ch.id}> (${ch.name})`, inline: true }], footer: `ID: ${ch.id}` }));
export const logChannelDelete  = (c, ch) => !ch.guild ? null : send(c, ch.guild.id, e({ color: 0xFF4444, title: '🗑️ Channel Deleted', fields: [{ name: '📢', value: `#${ch.name}`, inline: true }], footer: `ID: ${ch.id}` }));
export const logRoleCreate     = (c, r)  => send(c, r.guild.id, e({ color: 0x00C851, title: '🎭 Role Created', fields: [{ name: '🎭', value: `<@&${r.id}>`, inline: true }], footer: `ID: ${r.id}` }));
export const logRoleDelete     = (c, r)  => send(c, r.guild.id, e({ color: 0xFF4444, title: '🗑️ Role Deleted', fields: [{ name: '🎭', value: r.name, inline: true }], footer: `ID: ${r.id}` }));
export const logBanAdd         = (c, b)  => send(c, b.guild.id, e({ color: 0xFF4444, title: '🔨 Banned', fields: [{ name: '👤', value: `${b.user.tag}`, inline: true }, { name: '📝 Reason', value: b.reason || 'None', inline: true }], footer: `ID: ${b.user.id}` }));
export const logBanRemove      = (c, b)  => send(c, b.guild.id, e({ color: 0x00C851, title: '🔓 Unbanned', fields: [{ name: '👤', value: `${b.user.tag}`, inline: true }], footer: `ID: ${b.user.id}` }));

// ================================================================
//  Moderation Commands v2 — ban, kick, timeout, warn, clear, softban
// ================================================================
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { buildEmbed, buildModEmbed } from '../../utils/embedBuilder.js';
import ms from 'ms';

// ─── Case Manager helpers ─────────────────────────────────────
async function createCase(client, { guildId, userId, moderatorId, type, reason, duration }) {
  try {
    const { ModerationCase, GuildCounter, Warning } = client.db.models;
    const [counter] = await GuildCounter.findOrCreate({ where: { guildId }, defaults: { caseCount: 0 } });
    await counter.increment('caseCount');
    const caseId    = counter.caseCount;
    let expiresAt   = null;
    if (duration) expiresAt = new Date(Date.now() + Number(duration));
    const modCase   = await ModerationCase.create({ caseId, guildId, userId, moderatorId, type, reason: reason || 'No reason provided', duration: duration ? Number(duration) : null, expiresAt });
    if (type === 'warn') await Warning.create({ guildId, userId, moderatorId, reason: reason || 'No reason provided' });
    return modCase;
  } catch { return null; }
}

async function sendModLog(client, guildId, embed) {
  try {
    const { GuildSettings } = client.db.models;
    const s = await GuildSettings.findOne({ where: { guildId } });
    if (!s?.modLogChannelId) return;
    const ch = await client.channels.fetch(s.modLogChannelId).catch(() => null);
    if (ch?.isTextBased()) await ch.send({ embeds: [embed] });
  } catch {}
}

async function getWarnCount(client, guildId, userId) {
  try { return client.db.models.Warning.count({ where: { guildId, userId, active: true } }); } catch { return 0; }
}

async function checkEscalation(client, guildId, member, count) {
  const thresholds = { 3: 'timeout_1h', 5: 'timeout_24h', 7: 'kick', 10: 'ban' };
  const action     = thresholds[count];
  if (!action) return null;
  try {
    const [type, param] = action.split('_');
    if (type === 'timeout') { const d = { '1h': 3600000, '24h': 86400000 }[param] || 3600000; await member.timeout(d, '[Aura Auto-Escalation]'); return `Timeout ${param}`; }
    if (type === 'kick' && member.kickable) { await member.kick('[Aura Auto-Escalation]'); return 'Kick'; }
    if (type === 'ban') { await member.ban({ reason: '[Aura Auto-Escalation]' }); return 'Ban'; }
  } catch {}
  return null;
}

// ─── /ban ─────────────────────────────────────────────────────
export const ban = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(o => o.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason').setMaxLength(512))
    .addIntegerOption(o => o.setName('delete_days').setDescription('Delete message history (0-7)').setMinValue(0).setMaxValue(7))
    .addBooleanOption(o => o.setName('silent').setDescription('Do not DM the user')),
  userPermissions: [PermissionFlagsBits.BanMembers], botPermissions: [PermissionFlagsBits.BanMembers], guildOnly: true, cooldown: 3000,
  async execute(client, interaction) {
    await interaction.deferReply({ ephemeral: true });
    const lang       = await client.i18n.resolveLanguage(client, interaction.user.id, interaction.guildId);
    const target     = interaction.options.getUser('user');
    const reason     = interaction.options.getString('reason') || 'No reason provided';
    const deleteDays = interaction.options.getInteger('delete_days') ?? 0;
    const silent     = interaction.options.getBoolean('silent') ?? false;

    if (target.id === interaction.user.id) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: client.i18n.t('common.selfAction', {}, lang) })] });

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (member) {
      if (!member.bannable) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: client.i18n.t('common.botHigherRole', {}, lang) })] });
      if (interaction.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: client.i18n.t('common.higherRole', {}, lang) })] });
      if (!silent) await target.send({ embeds: [buildEmbed({ type: 'error', title: `Banned from ${interaction.guild.name}`, description: `**Reason:** ${reason}` })] }).catch(() => {});
    }

    await interaction.guild.members.ban(target.id, { reason: `[Aura] ${interaction.user.tag}: ${reason}`, deleteMessageDays: deleteDays });
    const modCase = await createCase(client, { guildId: interaction.guildId, userId: target.id, moderatorId: interaction.user.id, type: 'ban', reason });
    await sendModLog(client, interaction.guildId, buildModEmbed({ action: 'ban', user: target, moderator: interaction.user, reason, caseId: modCase?.caseId }));
    return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: client.i18n.t('moderation.ban.success', { user: target.tag }, lang), footer: `Case #${modCase?.caseId ?? '—'}`, timestamp: true })] });
  },
};

// ─── /kick ────────────────────────────────────────────────────
export const kick = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(o => o.setName('user').setDescription('Member to kick').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason').setMaxLength(512)),
  userPermissions: [PermissionFlagsBits.KickMembers], botPermissions: [PermissionFlagsBits.KickMembers], guildOnly: true, cooldown: 3000,
  async execute(client, interaction) {
    await interaction.deferReply({ ephemeral: true });
    const lang   = await client.i18n.resolveLanguage(client, interaction.user.id, interaction.guildId);
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    if (!target) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: client.i18n.t('common.invalidUser', {}, lang) })] });
    if (!target.kickable) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: client.i18n.t('common.botHigherRole', {}, lang) })] });
    if (interaction.member.roles.highest.comparePositionTo(target.roles.highest) <= 0) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: client.i18n.t('common.higherRole', {}, lang) })] });
    await target.user.send({ embeds: [buildEmbed({ type: 'warning', title: `Kicked from ${interaction.guild.name}`, description: `**Reason:** ${reason}` })] }).catch(() => {});
    await target.kick(`[Aura] ${interaction.user.tag}: ${reason}`);
    const mc = await createCase(client, { guildId: interaction.guildId, userId: target.id, moderatorId: interaction.user.id, type: 'kick', reason });
    await sendModLog(client, interaction.guildId, buildModEmbed({ action: 'kick', user: target.user, moderator: interaction.user, reason, caseId: mc?.caseId }));
    return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: client.i18n.t('moderation.kick.success', { user: target.user.tag }, lang), footer: `Case #${mc?.caseId ?? '—'}`, timestamp: true })] });
  },
};

// ─── /timeout ─────────────────────────────────────────────────
export const timeout = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName('user').setDescription('Member').setRequired(true))
    .addStringOption(o => o.setName('duration').setDescription('Duration (10m, 1h, 7d — max 28d)').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason').setMaxLength(512))
    .addBooleanOption(o => o.setName('remove').setDescription('Remove existing timeout')),
  userPermissions: [PermissionFlagsBits.ModerateMembers], botPermissions: [PermissionFlagsBits.ModerateMembers], guildOnly: true, cooldown: 2000,
  async execute(client, interaction) {
    await interaction.deferReply({ ephemeral: true });
    const lang     = await client.i18n.resolveLanguage(client, interaction.user.id, interaction.guildId);
    const target   = interaction.options.getMember('user');
    const durStr   = interaction.options.getString('duration');
    const reason   = interaction.options.getString('reason') || 'No reason provided';
    const remove   = interaction.options.getBoolean('remove') ?? false;
    if (!target?.moderatable) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: client.i18n.t('common.botHigherRole', {}, lang) })] });
    if (remove) { await target.timeout(null, `[Aura] ${interaction.user.tag}: ${reason}`); return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: client.i18n.t('moderation.timeout.removed', { user: target.user.tag }, lang) })] }); }
    const duration = ms(durStr);
    if (!duration || duration > 28 * 86400000) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ Invalid duration. Max 28 days.' })] });
    await target.timeout(duration, `[Aura] ${interaction.user.tag}: ${reason}`);
    await target.user.send({ embeds: [buildEmbed({ type: 'warning', title: `Timed Out in ${interaction.guild.name}`, description: `**Duration:** ${ms(duration, { long: true })}\n**Reason:** ${reason}` })] }).catch(() => {});
    const mc = await createCase(client, { guildId: interaction.guildId, userId: target.id, moderatorId: interaction.user.id, type: 'timeout', reason, duration });
    await sendModLog(client, interaction.guildId, buildModEmbed({ action: 'timeout', user: target.user, moderator: interaction.user, reason, caseId: mc?.caseId, duration: ms(duration, { long: true }) }));
    return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: client.i18n.t('moderation.timeout.success', { user: target.user.tag, duration: ms(duration, { long: true }) }, lang), footer: `Case #${mc?.caseId ?? '—'}`, timestamp: true })] });
  },
};

// ─── /warn ────────────────────────────────────────────────────
export const warn = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName('user').setDescription('Member').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(true).setMaxLength(512)),
  userPermissions: [PermissionFlagsBits.ModerateMembers], guildOnly: true, cooldown: 2000,
  async execute(client, interaction) {
    await interaction.deferReply({ ephemeral: true });
    const lang   = await client.i18n.resolveLanguage(client, interaction.user.id, interaction.guildId);
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason');
    if (!target) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: client.i18n.t('common.invalidUser', {}, lang) })] });
    const mc        = await createCase(client, { guildId: interaction.guildId, userId: target.id, moderatorId: interaction.user.id, type: 'warn', reason });
    const warnCount = await getWarnCount(client, interaction.guildId, target.id);
    await target.user.send({ embeds: [buildEmbed({ type: 'warning', title: `Warning in ${interaction.guild.name}`, description: `**Reason:** ${reason}\n**Total warnings:** ${warnCount}` })] }).catch(() => {});
    await sendModLog(client, interaction.guildId, buildModEmbed({ action: 'warn', user: target.user, moderator: interaction.user, reason, caseId: mc?.caseId, extra: [{ name: '🔢 Total Warnings', value: `${warnCount}`, inline: true }] }));
    const escalation = await checkEscalation(client, interaction.guildId, target, warnCount);
    const embeds = [buildEmbed({ type: 'success', description: client.i18n.t('moderation.warn.success', { user: target.user.tag, count: warnCount }, lang), footer: `Case #${mc?.caseId ?? '—'}`, timestamp: true })];
    if (escalation) embeds.push(buildEmbed({ type: 'warning', description: client.i18n.t('moderation.warn.escalate', { action: escalation }, lang) }));
    return interaction.editReply({ embeds });
  },
};

// ─── /clear ───────────────────────────────────────────────────
export const clear = {
  data: new SlashCommandBuilder()
    .setName('clear').setDescription('Bulk delete messages')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(o => o.setName('amount').setDescription('Messages to delete (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption(o => o.setName('user').setDescription('Only from this user'))
    .addBooleanOption(o => o.setName('bots').setDescription('Only bot messages')),
  userPermissions: [PermissionFlagsBits.ManageMessages], botPermissions: [PermissionFlagsBits.ManageMessages], guildOnly: true, cooldown: 5000,
  async execute(client, interaction) {
    await interaction.deferReply({ ephemeral: true });
    const lang   = await client.i18n.resolveLanguage(client, interaction.user.id, interaction.guildId);
    const amount = interaction.options.getInteger('amount');
    const user   = interaction.options.getUser('user');
    const bots   = interaction.options.getBoolean('bots');
    let messages = await interaction.channel.messages.fetch({ limit: 100 });
    if (user)  messages = messages.filter(m => m.author.id === user.id);
    if (bots)  messages = messages.filter(m => m.author.bot);
    const cutoff  = Date.now() - 14 * 86400000;
    const valid   = messages.filter(m => m.createdTimestamp > cutoff).first(amount);
    if (!valid.length) return interaction.editReply({ embeds: [buildEmbed({ type: 'warning', description: client.i18n.t('moderation.clear.noneFound', {}, lang) })] });
    const deleted = await interaction.channel.bulkDelete(valid, true);
    return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: client.i18n.t('moderation.clear.success', { count: deleted.size }, lang) })] });
  },
};

// ─── /softban ─────────────────────────────────────────────────
export const softban = {
  data: new SlashCommandBuilder()
    .setName('softban').setDescription('Softban to purge messages')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(o => o.setName('user').setDescription('Member').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason').setMaxLength(512))
    .addIntegerOption(o => o.setName('delete_days').setDescription('Days of messages (1-7)').setMinValue(1).setMaxValue(7)),
  userPermissions: [PermissionFlagsBits.BanMembers], botPermissions: [PermissionFlagsBits.BanMembers], guildOnly: true, cooldown: 5000,
  async execute(client, interaction) {
    await interaction.deferReply({ ephemeral: true });
    const lang       = await client.i18n.resolveLanguage(client, interaction.user.id, interaction.guildId);
    const target     = interaction.options.getUser('user');
    const reason     = interaction.options.getString('reason') || 'Softban';
    const deleteDays = interaction.options.getInteger('delete_days') ?? 7;
    
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (member) {
      if (!member.bannable) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: client.i18n.t('common.botHigherRole', {}, lang) })] });
      if (interaction.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: client.i18n.t('common.higherRole', {}, lang) })] });
    }

    await interaction.guild.members.ban(target.id, { reason: `[Aura Softban] ${reason}`, deleteMessageDays: deleteDays });
    await interaction.guild.members.unban(target.id, '[Aura Softban] Auto-unban');
    const mc = await createCase(client, { guildId: interaction.guildId, userId: target.id, moderatorId: interaction.user.id, type: 'softban', reason });
    await sendModLog(client, interaction.guildId, buildModEmbed({ action: 'softban', user: target, moderator: interaction.user, reason, caseId: mc?.caseId }));
    return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: `✅ **${target.tag}** softbanned. (${deleteDays} days of messages purged)`, footer: `Case #${mc?.caseId ?? '—'}`, timestamp: true })] });
  },
};

// ─── /history ─────────────────────────────────────────────────
export const history = {
  data: new SlashCommandBuilder()
    .setName('history')
    .setDescription('View moderation history')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName('user').setDescription('User to check').setRequired(true))
    .addIntegerOption(o => o.setName('page').setDescription('Page').setMinValue(1)),
  userPermissions: [PermissionFlagsBits.ModerateMembers], guildOnly: true, cooldown: 3000,
  async execute(client, interaction) {
    await interaction.deferReply({ ephemeral: true });
    const lang   = await client.i18n.resolveLanguage(client, interaction.user.id, interaction.guildId);
    const target = interaction.options.getUser('user');
    const page   = (interaction.options.getInteger('page') || 1) - 1;
    const { ModerationCase } = client.db.models;
    const cases = await ModerationCase.findAll({ where: { guildId: interaction.guildId, userId: target.id }, order: [['createdAt', 'DESC']], limit: 8, offset: page * 8 });
    const total = await ModerationCase.count({ where: { guildId: interaction.guildId, userId: target.id } });
    if (!cases.length) return interaction.editReply({ embeds: [buildEmbed({ type: 'info', description: client.i18n.t('moderation.history.empty', {}, lang) })] });
    const emojis = { ban: '🔨', kick: '👢', timeout: '🔇', warn: '📝', softban: '🔨', unban: '🔓', note: '📋' };
    const fields = cases.map(c => ({ name: `${emojis[c.type]||'📋'} Case #${c.caseId} — ${c.type.toUpperCase()}`, value: `**Reason:** ${c.reason}\n**By:** <@${c.moderatorId}>\n**Date:** <t:${Math.floor(new Date(c.createdAt).getTime()/1000)}:R>`, inline: false }));
    return interaction.editReply({ embeds: [buildEmbed({ type: 'primary', title: client.i18n.t('moderation.history.title', { user: target.tag }, lang), thumbnail: target.displayAvatarURL({ size: 128 }), fields, footer: `${total} total • Page ${page+1} of ${Math.ceil(total/8)}`, timestamp: true })] });
  },
};

// ─── /warnings ────────────────────────────────────────────────
export const warnings = {
  data: new SlashCommandBuilder()
    .setName('warnings').setDescription('View active warnings')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true)),
  userPermissions: [PermissionFlagsBits.ModerateMembers], guildOnly: true, cooldown: 3000,
  async execute(client, interaction) {
    await interaction.deferReply({ ephemeral: true });
    const target = interaction.options.getUser('user');
    const { Warning } = client.db.models;
    const warns = await Warning.findAll({ where: { guildId: interaction.guildId, userId: target.id, active: true }, order: [['createdAt', 'DESC']] });
    if (!warns.length) return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: `✅ **${target.tag}** has no active warnings.` })] });
    const fields = warns.map((w, i) => ({ name: `Warning ${i+1} • ID: ${w.id}`, value: `**Reason:** ${w.reason}\n**By:** <@${w.moderatorId}>\n**Date:** <t:${Math.floor(new Date(w.createdAt).getTime()/1000)}:R>`, inline: false }));
    return interaction.editReply({ embeds: [buildEmbed({ type: 'warning', title: `⚠️ Warnings — ${target.tag}`, thumbnail: target.displayAvatarURL({ size: 128 }), fields, footer: `${warns.length} active warning(s)`, timestamp: true })] });
  },
};

export default ban;

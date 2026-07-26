// ================================================================
//  Info Commands — /userinfo  /serverinfo  /roleinfo
//  These were referenced in /help but never implemented.
//  Pattern mirrors utilityCommands.js exactly.
// ================================================================
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { buildEmbed } from '../../../shared/utils/embedBuilder.js';

// ─── Permission bit → readable name map (top 12 most relevant) ──
const PERM_NAMES = {
  [PermissionFlagsBits.Administrator]:         'Administrator',
  [PermissionFlagsBits.ManageGuild]:           'Manage Server',
  [PermissionFlagsBits.ManageRoles]:           'Manage Roles',
  [PermissionFlagsBits.ManageChannels]:        'Manage Channels',
  [PermissionFlagsBits.BanMembers]:            'Ban Members',
  [PermissionFlagsBits.KickMembers]:           'Kick Members',
  [PermissionFlagsBits.ModerateMembers]:       'Timeout Members',
  [PermissionFlagsBits.ManageMessages]:        'Manage Messages',
  [PermissionFlagsBits.MentionEveryone]:       'Mention Everyone',
  [PermissionFlagsBits.ManageWebhooks]:        'Manage Webhooks',
  [PermissionFlagsBits.ViewAuditLog]:          'View Audit Log',
  [PermissionFlagsBits.ManageNicknames]:       'Manage Nicknames',
};

function readablePerms(permsBigInt) {
  const active = Object.entries(PERM_NAMES).filter(([bit]) => (BigInt(bit) & permsBigInt) === BigInt(bit));
  return active.length ? active.map(([, name]) => `\`${name}\``).join(', ') : 'None';
}

function msSince(date) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1)   return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days.toLocaleString()} days ago`;
}

// ─── /userinfo ────────────────────────────────────────────────────
export const userinfo = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Display detailed information about a user')
    .addUserOption(o =>
      o.setName('user')
        .setDescription('Target user (defaults to you)')
    ),
  guildOnly: true,
  cooldown:  5000,

  async execute(client, interaction) {
    await interaction.deferReply();

    const targetUser   = interaction.options.getUser('user') || interaction.user;
    const member       = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    const { UserProfile, ModerationCase, Warning } = client.db.models;

    // Fetch stats in parallel
    const [profile, caseCount, warnCount] = await Promise.all([
      UserProfile.findOne({ where: { userId: targetUser.id, guildId: interaction.guildId } }),
      ModerationCase.count({ where: { guildId: interaction.guildId, userId: targetUser.id } }),
      Warning.count({ where: { guildId: interaction.guildId, userId: targetUser.id, active: true } }),
    ]);

    const createdTs  = Math.floor(targetUser.createdTimestamp / 1000);
    const joinedTs   = member ? Math.floor(member.joinedTimestamp / 1000) : null;
    const roles      = member
      ? member.roles.cache
          .filter(r => r.id !== interaction.guildId)
          .sort((a, b) => b.position - a.position)
          .map(r => `<@&${r.id}>`)
      : [];

    const statusEmoji = { online:'🟢', idle:'🟡', dnd:'🔴', offline:'⚫' };
    const presence    = member?.presence?.status || 'offline';
    const activities  = member?.presence?.activities?.map(a => a.name).join(', ') || 'None';

    // Build acknowledgements (badges)
    const flags        = targetUser.flags?.toArray() || [];
    const badgeEmojis  = {
      Staff:                       '👷 Discord Staff',
      Partner:                     '🤝 Partner',
      Hypesquad:                   '🏠 HypeSquad',
      BugHunterLevel1:             '🐛 Bug Hunter',
      BugHunterLevel2:             '🐛 Gold Bug Hunter',
      HypeSquadOnlineHouse1:       '🏠 Bravery',
      HypeSquadOnlineHouse2:       '🏠 Brilliance',
      HypeSquadOnlineHouse3:       '🏠 Balance',
      PremiumEarlySupporter:       '💎 Early Supporter',
      TeamPseudoUser:              '👥 Team User',
      VerifiedBot:                 '✅ Verified Bot',
      VerifiedDeveloper:           '🔧 Verified Dev',
      CertifiedModerator:          '🛡️ Certified Mod',
      ActiveDeveloper:             '⚡ Active Dev',
    };
    const badges = flags.map(f => badgeEmojis[f]).filter(Boolean).join(' • ') || 'None';

    const fields = [
      { name: '🆔 User ID',      value: `\`${targetUser.id}\``,                              inline: true },
      { name: '🤖 Bot Account',  value: targetUser.bot ? 'Yes' : 'No',                       inline: true },
      { name: '📅 Created',      value: `<t:${createdTs}:D> (<t:${createdTs}:R>)`,           inline: false },
    ];

    if (joinedTs) {
      fields.push(
        { name: '📥 Joined Server', value: `<t:${joinedTs}:D> (<t:${joinedTs}:R>)`,          inline: false },
        { name: `${statusEmoji[presence]} Status`, value: `${presence.toUpperCase()} • ${activities}`, inline: true },
      );
    }

    if (member?.nickname) {
      fields.push({ name: '🏷️ Nickname', value: member.nickname, inline: true });
    }

    fields.push(
      { name: '🏆 Badges',      value: badges,                                               inline: false },
      { name: '🛡️ Mod Cases',   value: `${caseCount} total • ${warnCount} active warn(s)`,  inline: true },
    );

    if (profile) {
      fields.push(
        { name: '📈 XP / Level', value: `${Number(profile.xp).toLocaleString()} XP • Lv ${profile.level}`, inline: true },
      );
    }

    if (roles.length) {
      const roleStr = roles.slice(0, 10).join(' ');
      fields.push({ name: `🎭 Roles (${roles.length})`, value: roleStr + (roles.length > 10 ? ` +${roles.length - 10} more` : ''), inline: false });
    }

    return interaction.editReply({
      embeds: [buildEmbed({
        type:      'primary',
        title:     `👤 ${targetUser.username}${targetUser.discriminator !== '0' ? `#${targetUser.discriminator}` : ''}`,
        thumbnail: targetUser.displayAvatarURL({ size: 256 }),
        fields,
        footer:    `Requested by ${interaction.user.tag}`,
        timestamp: true,
      })],
    });
  },
};

// ─── /serverinfo ──────────────────────────────────────────────────
export const serverinfo = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Display detailed information about this server'),
  guildOnly: true,
  cooldown:  8000,

  async execute(client, interaction) {
    if (interaction.guild.ownerId !== interaction.user.id) {
      return interaction.reply({
        content: '❌ **Access Denied**: `/serverinfo` is restricted to the Server Owner only.',
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    const guild = interaction.guild;
    await guild.fetch(); // Ensure fresh data

    const createdTs   = Math.floor(guild.createdTimestamp / 1000);
    const owner       = await guild.fetchOwner().catch(() => null);

    const channels    = guild.channels.cache;
    const textCount   = channels.filter(c => c.type === 0).size;
    const voiceCount  = channels.filter(c => c.type === 2).size;
    const catCount    = channels.filter(c => c.type === 4).size;
    const threadCount = channels.filter(c => [11, 12].includes(c.type)).size;

    const roles       = guild.roles.cache.filter(r => r.id !== guild.id).size;
    const emojis      = guild.emojis.cache.size;
    const stickers    = guild.stickers.cache.size;
    const boosts      = guild.premiumSubscriptionCount || 0;
    const boostTier   = `Tier ${guild.premiumTier}`;

    const verLevels   = { 0:'None', 1:'Low', 2:'Medium', 3:'High', 4:'Highest' };
    const nsfwLevels  = { 0:'Default', 1:'Explicit', 2:'Safe', 3:'Age Restricted' };

    const features    = guild.features
      .filter(f => ['COMMUNITY', 'PARTNERED', 'VERIFIED', 'DISCOVERABLE', 'MONETIZATION_ENABLED'].includes(f))
      .map(f => `\`${f}\``).join(', ') || 'None';

    return interaction.editReply({
      embeds: [buildEmbed({
        type:      'primary',
        title:     `🏰 ${guild.name}`,
        thumbnail: guild.iconURL({ size: 256 }),
        image:     guild.bannerURL({ size: 1024 }) || undefined,
        fields: [
          { name: '🆔 Server ID',       value: `\`${guild.id}\``,                            inline: true },
          { name: '👑 Owner',            value: owner ? `<@${owner.id}>` : 'Unknown',          inline: true },
          { name: '📅 Created',          value: `<t:${createdTs}:D> (<t:${createdTs}:R>)`,    inline: false },
          { name: '👥 Members',          value: `${guild.memberCount.toLocaleString()} total`, inline: true },
          { name: '🎭 Roles',            value: `${roles}`,                                   inline: true },
          { name: '😀 Emojis/Stickers',  value: `${emojis} / ${stickers}`,                   inline: true },
          { name: '📢 Text Channels',    value: `${textCount}`,                               inline: true },
          { name: '🔊 Voice Channels',   value: `${voiceCount}`,                              inline: true },
          { name: '📁 Categories',       value: `${catCount} (+${threadCount} threads)`,      inline: true },
          { name: '🚀 Boosts',           value: `${boosts} boosts • ${boostTier}`,            inline: true },
          { name: '🔒 Verification',     value: verLevels[guild.verificationLevel] || 'None', inline: true },
          { name: '🔞 NSFW Level',       value: nsfwLevels[guild.nsfwLevel] || 'Default',     inline: true },
          { name: '✨ Features',          value: features,                                     inline: false },
        ],
        footer:    `Requested by ${interaction.user.tag}`,
        timestamp: true,
      })],
    });
  },
};

// ─── /roleinfo ────────────────────────────────────────────────────
export const roleinfo = {
  data: new SlashCommandBuilder()
    .setName('roleinfo')
    .setDescription('Display detailed information about a role')
    .addRoleOption(o => o.setName('role').setDescription('Role to inspect').setRequired(true)),
  guildOnly: true,
  cooldown:  5000,

  async execute(client, interaction) {
    await interaction.deferReply();
    const role       = interaction.options.getRole('role');
    const createdTs  = Math.floor(role.createdTimestamp / 1000);
    const memberCount = interaction.guild.members.cache.filter(m => m.roles.cache.has(role.id)).size;
    const permStr    = readablePerms(role.permissions.valueOf());
    const hexColor   = role.hexColor === '#000000' ? 'No Color' : role.hexColor;

    return interaction.editReply({
      embeds: [buildEmbed({
        type:      'primary',
        title:     `🎭 Role: ${role.name}`,
        color:     role.color || undefined,
        fields: [
          { name: '🆔 Role ID',      value: `\`${role.id}\``,                              inline: true },
          { name: '🎨 Color',        value: hexColor,                                      inline: true },
          { name: '👥 Members',      value: `${memberCount.toLocaleString()}`,             inline: true },
          { name: '📊 Position',     value: `#${role.position} of ${interaction.guild.roles.cache.size}`, inline: true },
          { name: '📅 Created',      value: `<t:${createdTs}:D> (<t:${createdTs}:R>)`,    inline: false },
          { name: '📌 Hoisted',      value: role.hoist ? '✅ Yes' : '❌ No',               inline: true },
          { name: '🔔 Mentionable',  value: role.mentionable ? '✅ Yes' : '❌ No',          inline: true },
          { name: '🤖 Managed',      value: role.managed ? '✅ Yes (Bot/Integration)' : '❌ No', inline: true },
          { name: '🛡️ Permissions', value: permStr,                                       inline: false },
        ],
        footer:    `Requested by ${interaction.user.tag}`,
        timestamp: true,
      })],
    });
  },
};

export default userinfo;

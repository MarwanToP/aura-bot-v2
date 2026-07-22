// ================================================================
//  Moderation — Case Manager: /unban  /note  /case
//  Fills gaps in the ModerationCase enum: 'unban' | 'note'
//  Pattern matches existing modCommands.js exactly.
// ================================================================
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { buildEmbed, buildModEmbed } from '../../../shared/utils/embedBuilder.js';
import { createCase, sendModLog } from '../../../shared/utils/moderation.js';

// ─── /unban ──────────────────────────────────────────────────────
export const unban = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user by their Discord ID or tag')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption(o =>
      o.setName('user_id')
        .setDescription('The user ID to unban')
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName('reason')
        .setDescription('Reason for the unban')
        .setMaxLength(512)
    ),
  userPermissions: [PermissionFlagsBits.BanMembers],
  botPermissions:  [PermissionFlagsBits.BanMembers],
  guildOnly: true,
  cooldown:  3000,

  async execute(client, interaction) {
    await interaction.deferReply({ ephemeral: true });
    const lang     = await client.i18n.resolveLanguage(client, interaction.user.id, interaction.guildId);
    const userId   = interaction.options.getString('user_id').trim();
    const reason   = interaction.options.getString('reason') || 'No reason provided';

    // Validate ID is snowflake-like
    if (!/^\d{17,20}$/.test(userId)) {
      return interaction.editReply({
        embeds: [buildEmbed({ type: 'error', description: '❌ Invalid user ID. Please provide a valid Discord user ID (17–20 digits).' })],
      });
    }

    // Confirm they are actually banned
    const ban = await interaction.guild.bans.fetch(userId).catch(() => null);
    if (!ban) {
      return interaction.editReply({
        embeds: [buildEmbed({ type: 'warning', description: '⚠️ That user does not appear to be banned from this server.' })],
      });
    }

    await interaction.guild.members.unban(userId, `[Aura] ${interaction.user.tag}: ${reason}`);

    const modCase = await createCase(client, {
      guildId:     interaction.guildId,
      userId,
      moderatorId: interaction.user.id,
      type:        'unban',
      reason,
    });

    await sendModLog(
      client,
      interaction.guildId,
      buildModEmbed({ action: 'unban', user: ban.user, moderator: interaction.user, reason, caseId: modCase?.caseId }),
    );

    // Attempt to DM the user
    await ban.user.send({
      embeds: [buildEmbed({
        type:        'success',
        title:       `Unbanned from ${interaction.guild.name}`,
        description: `**Reason:** ${reason}`,
      })],
    }).catch(() => {});

    return interaction.editReply({
      embeds: [buildEmbed({
        type:        'success',
        description: `✅ **${ban.user.tag}** has been unbanned.`,
        footer:      `Case #${modCase?.caseId ?? '—'}`,
        timestamp:   true,
      })],
    });
  },
};

// ─── /note ───────────────────────────────────────────────────────
export const note = {
  data: new SlashCommandBuilder()
    .setName('note')
    .setDescription('Add a private moderator note to a user (not visible to the user)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(true))
    .addStringOption(o =>
      o.setName('content')
        .setDescription('Note content (max 1000 chars)')
        .setRequired(true)
        .setMaxLength(1000)
    ),
  userPermissions: [PermissionFlagsBits.ModerateMembers],
  guildOnly: true,
  cooldown:  2000,

  async execute(client, interaction) {
    await interaction.deferReply({ ephemeral: true });
    const target  = interaction.options.getUser('user');
    const content = interaction.options.getString('content');

    const modCase = await createCase(client, {
      guildId:     interaction.guildId,
      userId:      target.id,
      moderatorId: interaction.user.id,
      type:        'note',
      reason:      content,
    });

    await sendModLog(
      client,
      interaction.guildId,
      buildModEmbed({ action: 'note', user: target, moderator: interaction.user, reason: content, caseId: modCase?.caseId }),
    );

    return interaction.editReply({
      embeds: [buildEmbed({
        type:        'info',
        title:       '📋 Note Added',
        description: `Note attached to **${target.tag}**.\n> ${content}`,
        footer:      `Case #${modCase?.caseId ?? '—'} • Only visible to staff`,
        timestamp:   true,
      })],
    });
  },
};

// ─── /case ───────────────────────────────────────────────────────
export const caseCmd = {
  data: new SlashCommandBuilder()
    .setName('case')
    .setDescription('Manage moderation cases')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    // View a single case
    .addSubcommand(s =>
      s.setName('view')
        .setDescription('View a specific case')
        .addIntegerOption(o => o.setName('id').setDescription('Case ID').setRequired(true).setMinValue(1))
    )
    // Edit reason
    .addSubcommand(s =>
      s.setName('reason')
        .setDescription('Edit the reason of a case')
        .addIntegerOption(o => o.setName('id').setDescription('Case ID').setRequired(true).setMinValue(1))
        .addStringOption(o => o.setName('reason').setDescription('New reason').setRequired(true).setMaxLength(512))
    )
    // Delete a case (admin-only)
    .addSubcommand(s =>
      s.setName('delete')
        .setDescription('Delete a case from the records [Admin]')
        .addIntegerOption(o => o.setName('id').setDescription('Case ID').setRequired(true).setMinValue(1))
    ),
  userPermissions: [PermissionFlagsBits.ModerateMembers],
  guildOnly: true,
  cooldown:  2000,

  async execute(client, interaction) {
    await interaction.deferReply({ ephemeral: true });
    const sub  = interaction.options.getSubcommand();
    const id   = interaction.options.getInteger('id');
    const { ModerationCase } = client.db.models;

    // ── view ──
    if (sub === 'view') {
      const modCase = await ModerationCase.findOne({
        where: { guildId: interaction.guildId, caseId: id },
      });

      if (!modCase) {
        return interaction.editReply({
          embeds: [buildEmbed({ type: 'error', description: `❌ Case **#${id}** not found in this server.` })],
        });
      }

      const typeEmojis = { ban:'🔨', kick:'👢', timeout:'🔇', timeout_remove:'🔓', warn:'📝', softban:'🔨', unban:'🔓', note:'📋' };
      const expiresStr = modCase.expiresAt
        ? `<t:${Math.floor(new Date(modCase.expiresAt).getTime() / 1000)}:R>`
        : 'Permanent';

      return interaction.editReply({
        embeds: [buildEmbed({
          type:   'primary',
          title:  `${typeEmojis[modCase.type] || '📋'} Case #${id} — ${modCase.type.toUpperCase()}`,
          fields: [
            { name: '👤 User',       value: `<@${modCase.userId}>`,      inline: true },
            { name: '🔨 Moderator',  value: `<@${modCase.moderatorId}>`, inline: true },
            { name: '🔖 Status',     value: modCase.active ? '🟢 Active' : '⚪ Inactive', inline: true },
            { name: '📝 Reason',     value: modCase.reason,              inline: false },
            { name: '📅 Created',    value: `<t:${Math.floor(new Date(modCase.createdAt).getTime() / 1000)}:R>`, inline: true },
            ...(modCase.duration ? [{ name: '⏱️ Expires', value: expiresStr, inline: true }] : []),
          ],
          footer:    `Case #${id}`,
          timestamp: true,
        })],
      });
    }

    // ── reason ──
    if (sub === 'reason') {
      const newReason = interaction.options.getString('reason');
      const modCase   = await ModerationCase.findOne({
        where: { guildId: interaction.guildId, caseId: id },
      });

      if (!modCase) {
        return interaction.editReply({
          embeds: [buildEmbed({ type: 'error', description: `❌ Case **#${id}** not found.` })],
        });
      }

      // Only allow the original moderator OR someone with ManageGuild
      const canEdit =
        modCase.moderatorId === interaction.user.id ||
        interaction.member.permissions.has(PermissionFlagsBits.ManageGuild);

      if (!canEdit) {
        return interaction.editReply({
          embeds: [buildEmbed({ type: 'error', description: '❌ You can only edit your own cases, or you need Manage Guild permission.' })],
        });
      }

      const oldReason = modCase.reason;
      await modCase.update({ reason: newReason });

      return interaction.editReply({
        embeds: [buildEmbed({
          type:        'success',
          title:       `📝 Case #${id} Updated`,
          description: `Reason updated for case **#${id}**.`,
          fields: [
            { name: 'Old Reason', value: oldReason, inline: false },
            { name: 'New Reason', value: newReason, inline: false },
          ],
          footer:    `Edited by ${interaction.user.tag}`,
          timestamp: true,
        })],
      });
    }

    // ── delete ──
    if (sub === 'delete') {
      // Require ManageGuild to delete cases
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.editReply({
          embeds: [buildEmbed({ type: 'error', description: '❌ Deleting cases requires **Manage Guild** permission.' })],
        });
      }

      const modCase = await ModerationCase.findOne({
        where: { guildId: interaction.guildId, caseId: id },
      });

      if (!modCase) {
        return interaction.editReply({
          embeds: [buildEmbed({ type: 'error', description: `❌ Case **#${id}** not found.` })],
        });
      }

      await modCase.destroy();
      client.logger?.info(`[Case] Case #${id} deleted by ${interaction.user.tag} in guild ${interaction.guildId}`);

      return interaction.editReply({
        embeds: [buildEmbed({
          type:        'success',
          description: `🗑️ Case **#${id}** has been permanently deleted.`,
          footer:      `Deleted by ${interaction.user.tag}`,
          timestamp:   true,
        })],
      });
    }
  },
};

// Named export alias so commandHandler picks it up correctly
export { caseCmd as case };
export default unban;

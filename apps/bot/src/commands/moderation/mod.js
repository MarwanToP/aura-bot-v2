import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } from 'discord.js';
import { buildModEmbed } from '../../../../../packages/utils/embedBuilder.js';
import { createCase, sendModLog } from '../../../../../packages/utils/moderation.js';
import ms from 'ms';

export default {
  data: new SlashCommandBuilder()
    .setName('mod')
    .setDescription('Execute moderation actions on a server member.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand((sub) =>
      sub
        .setName('warn')
        .setDescription('Issue a formal warning to a user.')
        .addUserOption((opt) => opt.setName('target').setDescription('The user to warn').setRequired(true))
        .addStringOption((opt) => opt.setName('reason').setDescription('Reason for warning').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('timeout')
        .setDescription('Temporarily mute/timeout a user.')
        .addUserOption((opt) => opt.setName('target').setDescription('The user to timeout').setRequired(true))
        .addIntegerOption((opt) => opt.setName('minutes').setDescription('Duration in minutes').setRequired(true).setMinValue(1).setMaxValue(40320))
        .addStringOption((opt) => opt.setName('reason').setDescription('Reason for timeout').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('ban')
        .setDescription('Ban a user from the server.')
        .addUserOption((opt) => opt.setName('target').setDescription('The user to ban').setRequired(true))
        .addStringOption((opt) => opt.setName('reason').setDescription('Reason for ban').setRequired(true))
    ),
  permissions: [PermissionFlagsBits.ModerateMembers],
  async execute(client, interaction) {
    if (!interaction && client?.options?.getSubcommand) {
      interaction = client;
      client = null;
    }

    // Acknowledge within Discord's 3-second deadline: the member fetch and case
    // creation below can be slow. Errors stay ephemeral (defer + editReply);
    // success confirmations keep their public visibility via followUp.
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    } catch {
      return; // interaction expired before it could be acknowledged
    }

    const subcommand = interaction.options.getSubcommand();
    const targetUser = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason');
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (subcommand === 'ban' && interaction.member && !interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.editReply({ content: '❌ You need `Ban Members` permission for this subcommand.', flags: MessageFlags.Ephemeral });
    }

    if (!member && subcommand !== 'ban') {
      return interaction.editReply({ content: '❌ Target member not found in this server.', flags: MessageFlags.Ephemeral });
    }

    if (subcommand === 'warn') {
      const modCase = await createCase(client, {
        guildId: interaction.guildId,
        userId: targetUser.id,
        moderatorId: interaction.user.id,
        type: 'warn',
        reason,
      });
      await sendModLog(client, interaction.guildId, buildModEmbed({ action: 'warn', user: targetUser, moderator: interaction.user, reason, caseId: modCase?.caseId }));

      return interaction.followUp({
        embeds: [
          new EmbedBuilder()
            .setColor('#f59e0b')
            .setTitle('⚠️ User Warned')
            .setDescription(`**Target:** <@${targetUser.id}>\n**Reason:** ${reason}\n**Moderator:** <@${interaction.user.id}>`),
        ],
      });
    }

    if (subcommand === 'timeout') {
      const minutes = interaction.options.getInteger('minutes');
      const duration = minutes * 60 * 1000;
      await member.timeout(duration, reason);

      const modCase = await createCase(client, {
        guildId: interaction.guildId,
        userId: targetUser.id,
        moderatorId: interaction.user.id,
        type: 'timeout',
        reason,
        duration,
      });
      await sendModLog(client, interaction.guildId, buildModEmbed({ action: 'timeout', user: targetUser, moderator: interaction.user, reason, caseId: modCase?.caseId, duration: ms(duration, { long: true }) }));

      return interaction.followUp({
        embeds: [
          new EmbedBuilder()
            .setColor('#ef4444')
            .setTitle('⏱️ User Timed Out')
            .setDescription(`**Target:** <@${targetUser.id}>\n**Duration:** ${minutes} minutes\n**Reason:** ${reason}`),
        ],
      });
    }

    if (subcommand === 'ban') {
      await interaction.guild.members.ban(targetUser.id, { reason });

      const modCase = await createCase(client, {
        guildId: interaction.guildId,
        userId: targetUser.id,
        moderatorId: interaction.user.id,
        type: 'ban',
        reason,
      });
      await sendModLog(client, interaction.guildId, buildModEmbed({ action: 'ban', user: targetUser, moderator: interaction.user, reason, caseId: modCase?.caseId }));

      return interaction.followUp({
        embeds: [
          new EmbedBuilder()
            .setColor('#b91c1c')
            .setTitle('🔨 User Banned')
            .setDescription(`**Target:** <@${targetUser.id}>\n**Reason:** ${reason}`),
        ],
      });
    }
  },
};

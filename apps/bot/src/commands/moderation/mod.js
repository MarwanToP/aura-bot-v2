import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { prisma } from '../../../../../packages/database/src/client.js';

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
        .addIntegerOption((opt) => opt.setName('minutes').setDescription('Duration in minutes').setRequired(true))
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
    const subcommand = interaction.options.getSubcommand();
    const targetUser = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason');
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!member && subcommand !== 'ban') {
      return interaction.reply({ content: '❌ Target member not found in this server.', ephemeral: true });
    }

    // Save action to Database
    try {
      await prisma.user.upsert({
        where: { id: targetUser.id },
        update: { username: targetUser.username },
        create: { id: targetUser.id, username: targetUser.username },
      });

      await prisma.guild.upsert({
        where: { id: interaction.guildId },
        update: {},
        create: { id: interaction.guildId },
      });

      await prisma.moderationLog.create({
        data: {
          guildId: interaction.guildId,
          userId: targetUser.id,
          moderatorId: interaction.user.id,
          action: subcommand,
          reason,
        },
      });
    } catch (err) {
      console.error('Database logging error:', err.message);
    }

    if (subcommand === 'warn') {
      return interaction.reply({
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
      await member.timeout(minutes * 60 * 1000, reason);

      return interaction.reply({
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

      return interaction.reply({
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

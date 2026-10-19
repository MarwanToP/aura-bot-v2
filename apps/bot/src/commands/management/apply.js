// ================================================================
//  AURA BOT v2.0 — Staff Applications System (Appy style)
// ================================================================
import { SlashCommandBuilder, MessageFlags, PermissionFlagsBits } from 'discord.js';
import { buildEmbed } from '../../../shared/utils/embedBuilder.js';
import { showApplicationModal } from '../../../shared/systems/applications/applicationSystem.js';

export const applyCommand = {
  data: new SlashCommandBuilder()
    .setName('apply')
    .setDescription('Submit a staff or moderator application')
    .addSubcommand(s => s
      .setName('start')
      .setDescription('Open the interactive application form')
      .addStringOption(o => o
        .setName('form')
        .setDescription('Which application form to open (defaults to the first open form)')
        .setRequired(false)
      )
    )
    .addSubcommand(s => s
      .setName('status')
      .setDescription('Check the status of your submitted application')
    ),

  botPermissions: [PermissionFlagsBits.SendMessages],
  guildOnly: true,
  cooldown: 5000,

  async execute(client, interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'start') {
      // showModal must be the FIRST response — no defer before this
      return showApplicationModal(interaction, interaction.options.getString('form'));
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch(() => {});

    if (sub === 'status') {
      const { StaffApplication, ApplicationForm } = client.db.models;

      const app = await StaffApplication.findOne({
        where: { guildId: interaction.guildId, userId: interaction.user.id },
        order: [['createdAt', 'DESC']],
      }).catch(() => null);

      if (!app) {
        return interaction.editReply({
          embeds: [buildEmbed({
            type: 'info',
            title: '📋 Application Status',
            description: 'You have not submitted an application in this server yet.\nUse `/apply start` to apply.',
          })],
        });
      }

      const form = app.formId
        ? await ApplicationForm.findByPk(app.formId).catch(() => null)
        : null;

      const statusMap = {
        pending:  '⏳ Pending review',
        approved: '✅ Approved',
        rejected: '❌ Rejected',
      };

      const lines = [
        `**Form:** ${form?.name || 'Staff Application'}`,
        `**Status:** ${statusMap[app.status] || app.status}`,
        `**Submitted:** <t:${Math.floor(new Date(app.createdAt).getTime() / 1000)}:R>`,
      ];
      if (app.reviewedAt) {
        lines.push(`**Reviewed:** <t:${Math.floor(new Date(app.reviewedAt).getTime() / 1000)}:R>`);
      }

      return interaction.editReply({
        embeds: [buildEmbed({
          type: app.status === 'approved' ? 'success' : app.status === 'rejected' ? 'error' : 'info',
          title: '📋 Application Status',
          description: lines.join('\n'),
        })],
      });
    }
  },
};

export default applyCommand;

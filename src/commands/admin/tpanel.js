import { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
import { buildEmbed } from '../../utils/embedBuilder.js';

export const tpanel = {
  data: new SlashCommandBuilder()
    .setName('tpanel')
    .setDescription('Open the Visual Ticket Configurator')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  guildOnly: true,

  async execute(client, interaction) {
    const embed = buildEmbed({
      type: 'premium',
      title: '🎫 Aura Ticket Configuration Panel',
      description: 'Manage ticket categories, settings, and team access visually.\n\nUse the buttons below to open the setup modals.',
      footer: 'Aura Bot Enterprise Ticket Engine'
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('tpanel_add').setLabel('Add Category').setStyle(ButtonStyle.Success).setEmoji('➕'),
      new ButtonBuilder().setCustomId('tpanel_edit').setLabel('Edit Category').setStyle(ButtonStyle.Primary).setEmoji('✏️'),
      new ButtonBuilder().setCustomId('tpanel_delete').setLabel('Delete Category').setStyle(ButtonStyle.Danger).setEmoji('🗑️')
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};

export default tpanel;

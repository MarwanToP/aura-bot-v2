import { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { buildEmbed } from '../../../shared/utils/embedBuilder.js';

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

    const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    const collector = msg.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 120000,
    });

    collector.on('collect', async i => {
      const action = i.customId.replace('tpanel_', '');
      const actionLabel = action === 'add'
        ? 'Add Category'
        : action === 'edit'
          ? 'Edit Category'
          : action === 'delete'
            ? 'Delete Category'
            : null;

      if (!actionLabel) return i.deferUpdate();
      await i.reply({
        embeds: [buildEmbed({
          type: 'info',
          title: '🎫 Ticket Configurator',
          description: `**${actionLabel}** is not wired to persistent storage yet.\nUse \`/settings\` to configure ticket system values for now.`,
        })],
        ephemeral: true,
      });
    });

    collector.on('end', async () => {
      await interaction.editReply({ components: [] }).catch(() => {});
    });
  }
};

export default tpanel;

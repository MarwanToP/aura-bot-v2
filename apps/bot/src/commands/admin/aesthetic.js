import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { buildEmbed } from '../../../shared/utils/embedBuilder.js';

export const aesthetic = {
  data: new SlashCommandBuilder()
    .setName('aesthetic')
    .setDescription('Skinnable Aesthetic Engine: Customize bot emojis')
    .addStringOption(opt => opt.setName('success_emoji').setDescription('Custom emoji ID for success').setRequired(false))
    .addStringOption(opt => opt.setName('error_emoji').setDescription('Custom emoji ID for error').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  guildOnly: true,

  async execute(client, interaction) {
    const success = interaction.options.getString('success_emoji');
    const error   = interaction.options.getString('error_emoji');

    await interaction.deferReply().catch(() => {});

    try {
      const { GuildSettings } = client.db.models;
      const guildSettings = await GuildSettings.findOne({ where: { guildId: interaction.guildId } });
      const currentEmojis = (guildSettings?.customEmojis) || {};
      if (success) currentEmojis.success = success;
      if (error)   currentEmojis.error = error;

      if (!success && !error) {
        return interaction.editReply({
          embeds: [buildEmbed({
            type: 'warning',
            description: '⚠️ Provide at least one of `success_emoji` or `error_emoji` to update.'
          })],
        });
      }

      await GuildSettings.update({ customEmojis: currentEmojis }, { where: { guildId: interaction.guildId } });

      return interaction.editReply({
        embeds: [buildEmbed({
          type: 'success',
          description: `✨ Server aesthetics updated!\n\n**Success Icon:** ${success || 'unchanged'}\n**Error Icon:** ${error || 'unchanged'}`
        })],
      });
    } catch (err) {
      client.logger?.error?.('[Aesthetic] failed:', err);
      return interaction.editReply({
        embeds: [buildEmbed({ type: 'error', description: '❌ Failed to save aesthetic settings.' })],
      }).catch(() => {});
    }
  }
};

export default aesthetic;

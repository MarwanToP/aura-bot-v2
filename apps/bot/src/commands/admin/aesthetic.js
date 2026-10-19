import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { buildEmbed } from '../../../shared/utils/embedBuilder.js';

// Custom emoji id, e.g. <a:blob:123456789012345678> or a plain unicode emoji.
const CUSTOM_EMOJI_PATTERN = /^<a?:[a-zA-Z0-9_]{2,32}:\d{15,25}>$/;

function isValidEmoji(value) {
  if (!value) return false;
  if (CUSTOM_EMOJI_PATTERN.test(value)) return true;
  // A single unicode emoji (possibly with a variation selector / skin tone).
  return /\p{Extended_Pictographic}/u.test(value) && [...value].length <= 3;
}

export const aesthetic = {
  data: new SlashCommandBuilder()
    .setName('aesthetic')
    .setDescription('Skinnable Aesthetic Engine: Customize bot emojis')
    .addStringOption(opt => opt.setName('success_emoji').setDescription('Custom emoji ID for success').setRequired(false))
    .addStringOption(opt => opt.setName('error_emoji').setDescription('Custom emoji ID for error').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  botPermissions: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks],
  guildOnly: true,

  async execute(client, interaction) {
    const success = interaction.options.getString('success_emoji');
    const error   = interaction.options.getString('error_emoji');

    await interaction.deferReply().catch(() => {});

    try {
      for (const [label, value] of [['success_emoji', success], ['error_emoji', error]]) {
        if (value && !isValidEmoji(value)) {
          return interaction.editReply({
            embeds: [buildEmbed({
              type: 'error',
              description: `❌ \`${label}\` is not a valid emoji. Use a custom emoji id (<a:name:123456789012345678>) or a plain emoji.`
            })],
          });
        }
      }

      if (!success && !error) {
        return interaction.editReply({
          embeds: [buildEmbed({
            type: 'warning',
            description: '⚠️ Provide at least one of `success_emoji` or `error_emoji` to update.'
          })],
        });
      }

      const { GuildSettings } = client.db.models;
      // findOrCreate so a guild without a settings row still persists the change
      // (update() against a missing row is a silent no-op).
      const [guildSettings] = await GuildSettings.findOrCreate({
        where: { guildId: interaction.guildId },
        defaults: { customEmojis: {} },
      });

      const currentEmojis = { ...(guildSettings.customEmojis || {}) };
      if (success) currentEmojis.success = success;
      if (error)   currentEmojis.error   = error;

      await guildSettings.update({ customEmojis: currentEmojis });

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

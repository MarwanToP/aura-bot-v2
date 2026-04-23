// ================================================================
//  AURA BOT v2.0 — Fun & Social
// ================================================================
import { SlashCommandBuilder } from 'discord.js';
import { buildEmbed } from '../../../shared/utils/embedBuilder.js';

// ─── /avatar ──────────────────────────────────────────────────
export const avatar = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('View a high-resolution version of a users avatar')
    .addUserOption(o => o.setName('target').setDescription('User to view avatar for')),

  cooldown: 5000,
  async execute(client, interaction) {
    const user = interaction.options.getUser('target') || interaction.user;
    const png  = user.displayAvatarURL({ extension: 'png', size: 2048 });
    const jpg  = user.displayAvatarURL({ extension: 'jpg', size: 2048 });
    const webp = user.displayAvatarURL({ extension: 'webp', size: 2048 });

    const embed = buildEmbed({
      type:  'fun',
      title: `👤 ${user.username}'s Avatar`,
      image: png,
      description: `[PNG](${png}) • [JPG](${jpg}) • [WEBP](${webp})`,
      footer: `Requested by ${interaction.user.tag}`,
    });

    return interaction.reply({ embeds: [embed] });
  },
};

// ─── /meme ─────────────────────────────────────────────────────
export const meme = {
  data: new SlashCommandBuilder()
    .setName('meme')
    .setDescription('Generate a random meme from AI neural core'),
    
  cooldown: 5000,
  async execute(client, interaction) {
    await interaction.deferReply();
    if (!client.ai.isAvailable()) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ AI offline.' })] });

    try {
      const result = await client.ai.prompt("Generate a funny, clean programming or Discord-related joke/meme text. Keep it short.", { maxTokens: 100 });
      return interaction.editReply({
        embeds: [buildEmbed({
          type: 'fun',
          title: '🎭 Neural Meme Generator',
          description: result.content,
          footer: 'AI Generated Humor',
        })]
      });
    } catch {
      return interaction.editReply({ content: 'Failed to extract humor from core.' });
    }
  }
};

export default avatar;

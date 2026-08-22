import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('View Aura Bot features, active modules, and documentation.'),
  cooldown: 5,
  async execute(client, interaction) {
    const embed = new EmbedBuilder()
      .setColor('#8b5cf6')
      .setTitle('⚡ Aura Bot v2 — Command & Module Guide')
      .setDescription(
        'Aura Bot is an enterprise Discord management platform with neural AI moderation, dynamic TempVoice rooms, and web-based telemetry.'
      )
      .addFields(
        {
          name: '🛡️ Neural Security & Moderation',
          value: '`/mod` — Warn, timeout, kick, or ban users with database logging.\nAuto-moderation powered by Gemini 1.5 Flash.',
        },
        {
          name: '🔊 Dynamic TempVoice',
          value: 'Join any designated "Create Voice" channel to generate an auto-managed room.',
        },
        {
          name: '📊 Dashboard & Statistics',
          value: 'Manage your server configuration online at your web dashboard.',
        }
      )
      .setFooter({ text: 'Aura Bot Control' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Web Dashboard')
        .setStyle(ButtonStyle.Link)
        .setURL('http://localhost:3000')
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};

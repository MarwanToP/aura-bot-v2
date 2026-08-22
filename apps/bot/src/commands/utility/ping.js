import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency and gateway heartbeat.'),
  cooldown: 5,
  async execute(client, interaction) {
    const sent = await interaction.deferReply({ fetchReply: true });
    const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;

    const embed = new EmbedBuilder()
      .setColor('#8b5cf6')
      .setTitle('🏓 Pong!')
      .addFields(
        { name: 'WebSocket Latency', value: `${client.ws.ping}ms`, inline: true },
        { name: 'Roundtrip Latency', value: `${roundtrip}ms`, inline: true }
      )
      .setFooter({ text: 'Aura Bot v2' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};

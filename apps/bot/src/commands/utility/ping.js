import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency, uptime, and gateway heartbeat.'),
  cooldown: 5000, // ms — same unit as every other command
  async execute(clientOrInteraction, interactionOrClient) {
    const interaction = clientOrInteraction?.deferReply ? clientOrInteraction : interactionOrClient;
    const client = clientOrInteraction?.ws ? clientOrInteraction : (interactionOrClient?.ws ? interactionOrClient : interaction?.client);

    const response = await interaction.deferReply({ withResponse: true });
    const sent = response?.resource?.message;
    const delay = sent?.createdTimestamp ? (sent.createdTimestamp - interaction.createdTimestamp) : 0;
    const wsPing = client?.ws?.ping !== undefined ? `${Math.round(client.ws.ping)}ms` : 'N/A';
    const uptime = client?.readyTimestamp ? `<t:${Math.floor(client.readyTimestamp / 1000)}:R>` : 'Active';

    const embed = new EmbedBuilder()
      .setColor('#8b5cf6')
      .setTitle('🏓 Pong!')
      .addFields(
        { name: 'WebSocket Latency', value: `\`${wsPing}\``, inline: true },
        { name: 'Roundtrip Latency', value: `\`${delay}ms\``, inline: true },
        { name: 'Uptime', value: uptime, inline: false }
      )
      .setFooter({ text: 'Aura Bot v2' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency, uptime, and gateway heartbeat.'),
  cooldown: 5000, // ms — same unit as every other command
  async execute(clientOrInteraction, interactionOrClient) {
    const interaction = clientOrInteraction?.deferReply ? clientOrInteraction : interactionOrClient;
    const client = clientOrInteraction?.ws ? clientOrInteraction : (interactionOrClient?.ws ? interactionOrClient : interaction?.client);

    // A deferred interaction has no message resource yet, so the roundtrip has
    // to be measured from the reply that was actually sent. When that read
    // fails the only honest number left is the time since the interaction was
    // created — it is labelled as such instead of being passed off as a
    // roundtrip.
    await interaction.deferReply();
    let sent = null;
    try {
      sent = await interaction.fetchReply();
    } catch { /* fall back to the local clock below */ }
    const measured = Boolean(sent?.createdTimestamp);
    const delay = measured
      ? Math.max(0, sent.createdTimestamp - interaction.createdTimestamp)
      : Math.max(0, Date.now() - interaction.createdTimestamp);
    const latencyLabel = measured ? 'Roundtrip Latency' : 'Response Time';
    const wsPing = client?.ws?.ping !== undefined ? `${Math.round(client.ws.ping)}ms` : 'N/A';
    const uptime = client?.readyTimestamp ? `<t:${Math.floor(client.readyTimestamp / 1000)}:R>` : 'Active';

    const embed = new EmbedBuilder()
      .setColor('#8b5cf6')
      .setTitle('🏓 Pong!')
      .addFields(
        { name: 'WebSocket Latency', value: `\`${wsPing}\``, inline: true },
        { name: latencyLabel, value: `\`${delay}ms\``, inline: true },
        { name: 'Uptime', value: uptime, inline: false }
      )
      .setFooter({ text: 'Aura Bot v2' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};

import { pubsubSubscriber, ACTION_CHANNEL } from '../../../../packages/redis/src/queue.js';
import { EmbedBuilder } from 'discord.js';

/**
 * Listens for enforcement actions dispatched by the AI Worker.
 */
export function initModerationActionSubscriber(client) {
  pubsubSubscriber.subscribe(ACTION_CHANNEL, (err) => {
    if (err) console.error('❌ Failed to subscribe to moderation channel:', err);
    else console.log('📡 Subscribed to AI Moderation Action Channel.');
  });

  pubsubSubscriber.on('message', async (channel, messageData) => {
    if (channel !== ACTION_CHANNEL) return;

    try {
      const action = JSON.parse(messageData);
      const { guildId, channelId, messageId, authorId, result } = action;

      if (!result.flagged) return;

      const guild = await client.guilds.fetch(guildId).catch(() => null);
      if (!guild) return;

      const channelObj = await guild.channels.fetch(channelId).catch(() => null);
      if (!channelObj) return;

      // Delete flagged message
      const targetMessage = await channelObj.messages.fetch(messageId).catch(() => null);
      if (targetMessage) await targetMessage.delete().catch(() => null);

      // Send warning alert
      const alertEmbed = new EmbedBuilder()
        .setColor('#ef4444')
        .setTitle('🛡️ Neural Moderation Alert')
        .setDescription(
          `<@${authorId}>'s message was removed by the **Neural Moderation Engine**.\n\n` +
          `**Category:** \`${result.category}\`\n` +
          `**Severity:** \`${result.severityScore}/100\`\n` +
          `**Reason:** ${result.reason}`
        )
        .setFooter({ text: 'Aura AI Shield (Gemini 1.5 Flash)' })
        .setTimestamp();

      await channelObj.send({ embeds: [alertEmbed] });

      // Apply timeout if high severity
      if (result.recommendedAction === 'timeout' || result.severityScore >= 80) {
        const member = await guild.members.fetch(authorId).catch(() => null);
        if (member && member.moderatable) {
          await member.timeout(15 * 60 * 1000, `Neural Moderation: ${result.reason}`);
        }
      }
    } catch (err) {
      console.error('❌ Error executing moderation action:', err);
    }
  });
}

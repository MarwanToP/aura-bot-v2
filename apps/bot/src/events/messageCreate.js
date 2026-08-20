import { enqueueAIJob } from '../../../../packages/redis/src/queue.js';
import { prisma } from '../../../../packages/database/src/client.js';

export async function handleMessageCreate(client, message) {
  // Ignore bots and direct messages
  if (message.author.bot || !message.guild) return;

  try {
    // Check if neural moderation is enabled for this server
    const guildConfig = await prisma.guild.findUnique({
      where: { id: message.guild.id },
      select: { neuralModerationEnabled: true },
    });

    if (guildConfig && !guildConfig.neuralModerationEnabled) return;

    // Enqueue message for asynchronous Gemini analysis
    await enqueueAIJob('MODERATION_ANALYZE', {
      messageId: message.id,
      channelId: message.channel.id,
      guildId: message.guild.id,
      authorId: message.author.id,
      messageText: message.content,
    });
  } catch (error) {
    console.error('⚠️ Error queuing message for neural moderation:', error.message);
  }
}

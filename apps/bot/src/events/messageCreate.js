import { redis, enqueueAIJob } from '../../../../packages/redis/src/queue.js';
import { prisma } from '../../../../packages/database/src/client.js';

export async function handleMessageCreate(client, message) {
  // Ignore bots and direct messages
  if (message.author.bot || !message.guild) return;

  try {
    const cacheKey = `aura:guild:${message.guild.id}:config`;
    let neuralEnabled = true;

    const cached = await redis.get(cacheKey).catch(() => null);

    if (cached !== null) {
      neuralEnabled = cached === '1';
    } else {
      // Check database
      const guildConfig = await prisma.guild.findUnique({
        where: { id: message.guild.id },
        select: { neuralModerationEnabled: true },
      });

      neuralEnabled = guildConfig ? Boolean(guildConfig.neuralModerationEnabled) : true;
      // Cache result in Redis for 5 minutes (300 seconds)
      await redis.setex(cacheKey, 300, neuralEnabled ? '1' : '0').catch(() => null);
    }

    if (!neuralEnabled) return;

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

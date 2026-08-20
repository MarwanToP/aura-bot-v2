import { dequeueAIJob } from './queues/aiQueue.js';
import { analyzeContent } from './gemini/moderator.js';
import { pubsubPublisher, ACTION_CHANNEL } from '../../../packages/redis/src/queue.js';

console.log('🤖 Starting Aura AI Worker Service (Gemini 1.5 Flash Neural Engine)...');

async function processLoop() {
  while (true) {
    try {
      const job = await dequeueAIJob(3);
      if (!job) continue;

      if (job.type === 'MODERATION_ANALYZE') {
        const { messageText, authorId, guildId, channelId, messageId } = job.payload;
        const analysis = await analyzeContent(messageText, authorId, guildId);

        if (analysis.success) {
          await pubsubPublisher.publish(
            ACTION_CHANNEL,
            JSON.stringify({
              guildId,
              channelId,
              messageId,
              authorId,
              result: analysis.data,
            })
          );
        }
      }
    } catch (error) {
      console.error('❌ Error processing AI job:', error.message);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

processLoop();

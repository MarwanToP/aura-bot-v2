import { dequeueAIJob } from './queues/aiQueue.js';
import { analyzeContent } from './gemini/moderator.js';
import { pubsubPublisher, ACTION_CHANNEL } from '../../../packages/redis/src/queue.js';

export default {
  async fetch(request, env, ctx) {
    console.log('🤖 Starting Aura AI Worker Service (Gemini 1.5 Flash Neural Engine)...');

    ctx.waitUntil((async () => {
        try {
          const job = await dequeueAIJob(3);
          if (job && job.type === 'MODERATION_ANALYZE') {
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
        }
    })());

    return new Response("AI Worker running.", { status: 200 });
  }
};

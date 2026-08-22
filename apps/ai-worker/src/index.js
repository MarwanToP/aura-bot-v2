import { dequeueAIJob } from './queues/aiQueue.js';
import { analyzeContent } from './gemini/moderator.js';
import { pubsubPublisher, ACTION_CHANNEL } from '../../../packages/redis/src/queue.js';

let processLoopRunning = false;

async function processLoop() {
  if (processLoopRunning) return;
  processLoopRunning = true;
  console.log('🤖 Starting Aura AI Worker Service (Gemini 1.5 Flash Neural Engine)...');

  // A fire-and-forget loop for background tasks
  (async () => {
    while (true) {
      try {
        const job = await dequeueAIJob(3);
        if (!job) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }

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
  })();
}

export default {
  async fetch(request, env, ctx) {
    // Start background processing on first request if not already running
    ctx.waitUntil(processLoop());

    return new Response(JSON.stringify({ status: "Aura AI Worker is running" }), {
      headers: { "Content-Type": "application/json" }
    });
  }
};

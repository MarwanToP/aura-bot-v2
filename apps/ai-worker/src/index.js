import { dequeueAIJob } from './queues/aiQueue.js';
import { analyzeContent } from './gemini/moderator.js';

console.log('🤖 Starting Aura AI Worker Service (Gemini 1.5 Flash Neural Engine)...');

let isRunning = true;

async function processLoop() {
  while (isRunning) {
    try {
      const job = await dequeueAIJob(3);
      if (!job) continue;

      console.log(`⚙️ Processing AI Job [${job.id}] - Type: ${job.type}`);

      if (job.type === 'MODERATION_ANALYZE') {
        const { messageText, authorId, guildId } = job.payload;
        const analysis = await analyzeContent(messageText, authorId, guildId);
        
        console.log(`✅ Job [${job.id}] Complete - Flagged: ${analysis.data?.flagged} (Score: ${analysis.data?.severityScore})`);
      }
    } catch (error) {
      console.error('❌ Error processing AI job:', error.message);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

process.on('SIGINT', () => {
  console.log('🛑 Shutting down AI Worker...');
  isRunning = false;
  process.exit(0);
});

processLoop();

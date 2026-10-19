import { startConsumerLoop, stopConsumerLoop } from './consumer.js';
import { closeAIQueue } from './queues/aiQueue.js';
import { pubsubPublisher } from '../../../packages/redis/src/queue.js';
import { MODERATION_MODEL } from './gemini/client.js';

console.log(`🤖 Starting Aura AI Worker Service (Neural Engine — model: ${MODERATION_MODEL})...`);

startConsumerLoop();

// ── Graceful shutdown ────────────────────────────────────────
// SIGTERM/SIGINT stop the consume loop, close the Redis connections and
// exit 0 — a redeploy must never leave a half-dead worker behind.
let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`👋 [AI Worker] ${signal} received — shutting down gracefully...`);
  stopConsumerLoop();

  // Hard cap: the process is gone within a few seconds even if Redis hangs.
  const forceExit = setTimeout(() => {
    console.warn('⚠️ [AI Worker] Shutdown timeout reached — forcing exit.');
    process.exit(0);
  }, 5000);

  try {
    await closeAIQueue();
  } catch (err) {
    console.warn('⚠️ [AI Worker] Failed to close the queue connection:', err?.message);
  }

  try {
    await pubsubPublisher.quit();
  } catch (err) {
    console.warn('⚠️ [AI Worker] Failed to close the publisher connection:', err?.message);
  }

  clearTimeout(forceExit);
  process.exit(0);
}

process.on('SIGTERM', () => { shutdown('SIGTERM'); });
process.on('SIGINT', () => { shutdown('SIGINT'); });

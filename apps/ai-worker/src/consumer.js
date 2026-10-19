// ================================================================
//  Shared AI job consumer
//
//  ONE implementation of the queue consumer, used by both entrypoints:
//    • standalone worker — apps/ai-worker/src/index.js   (npm run start:worker)
//    • embedded worker   — apps/ai-worker/src/embedded.js (inside the bot process)
//
//  The embedded worker exists because the Docker image only runs the bot
//  (`npm start`): without a consumer in the same process the `aura:ai:jobs`
//  queue is never drained and AI moderation is silently dead.
//
//  The consumer contract is unchanged: jobs are read from the Redis list
//  "aura:ai:jobs" with the shape { id, type, payload, createdAt } and the
//  results are published to the "aura:moderation:actions" channel.
// ================================================================

import { dequeueAIJob, pushDeadLetterJob, DEAD_LETTER_KEY } from './queues/aiQueue.js';
import { analyzeContent } from './gemini/moderator.js';
import { pubsubPublisher, ACTION_CHANNEL } from '../../../packages/redis/src/queue.js';

// BLPOP timeout — the loop wakes up at least every 3s to check the stop flag.
const DEQUEUE_TIMEOUT_SECONDS = 3;
// Bounded retries: BLPOP removes the job immediately, so a failure would
// otherwise drop it on the floor.
const MAX_ATTEMPTS = 3;
const RETRY_BACKOFF_MS = 1000;
// Pause when the queue is empty (or Redis is unreachable) so the loop can
// never spin hot.
const IDLE_DELAY_MS = 250;

let running = false;
let loopPromise = null;
// Every start/stop bumps the token, so a loop that is still winding down can
// never keep running next to a freshly started one.
let runToken = 0;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Processes a single job. Throws when the job could not be handled so the
 * caller can retry / dead-letter it.
 */
async function processJob(job) {
  if (job?.type !== 'MODERATION_ANALYZE') {
    console.warn(`⚠️ [AI Worker] Unsupported job type "${job?.type}" — ignored.`);
    return;
  }

  const payload = job.payload || {};
  const { messageText, authorId, guildId, channelId, messageId } = payload;

  const analysis = await analyzeContent(messageText, authorId, guildId);
  if (!analysis?.success) {
    throw new Error(analysis?.error || 'Neural moderation analysis failed');
  }

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

/**
 * Runs a job with bounded retries. After the last attempt the job is pushed
 * to the dead-letter list so it is never silently lost.
 */
async function runJobWithRetry(job) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await processJob(job);
      return true;
    } catch (error) {
      console.error(
        `❌ [AI Worker] Job ${job?.id ?? 'unknown'} failed (attempt ${attempt}/${MAX_ATTEMPTS}):`,
        error?.message
      );
      if (attempt < MAX_ATTEMPTS) {
        await sleep(RETRY_BACKOFF_MS * attempt);
      }
    }
  }

  try {
    await pushDeadLetterJob(job);
    console.error(
      `☠️ [AI Worker] Job ${job?.id ?? 'unknown'} moved to the dead-letter list "${DEAD_LETTER_KEY}" after ${MAX_ATTEMPTS} attempts.`
    );
  } catch (error) {
    console.error(
      `☠️ [AI Worker] Dead-letter push failed for job ${job?.id ?? 'unknown'}:`,
      error?.message
    );
  }
  return false;
}

/**
 * Starts the consume loop. Returns a promise that resolves when the loop
 * stops. Calling it twice is a no-op (the running loop is returned).
 */
export function startConsumerLoop() {
  if (running) return loopPromise;

  running = true;
  const token = ++runToken;

  loopPromise = (async () => {
    console.log('🔁 [AI Worker] Consumer loop started (queue: aura:ai:jobs).');

    while (running && token === runToken) {
      let job = null;
      try {
        job = await dequeueAIJob(DEQUEUE_TIMEOUT_SECONDS);
      } catch (error) {
        console.error('❌ [AI Worker] Dequeue error:', error?.message);
      }

      if (!job) {
        // Empty queue (or Redis hiccup) — pause briefly to avoid a hot loop.
        await sleep(IDLE_DELAY_MS);
        continue;
      }

      if (!running || token !== runToken) break;
      await runJobWithRetry(job);
    }

    console.log('🛑 [AI Worker] Consumer loop stopped.');
  })();

  return loopPromise;
}

/**
 * Requests the loop to stop. The current job is allowed to finish; the loop
 * exits at the latest after the current BLPOP timeout.
 */
export function stopConsumerLoop() {
  running = false;
  runToken++;
}

/**
 * Whether the consume loop is currently active.
 */
export function isConsumerRunning() {
  return running;
}

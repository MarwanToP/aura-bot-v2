import { Redis } from 'ioredis';
import { env } from '../../../../packages/config/src/env.js';

// A dead Redis must never flood the log (the consumer polls the queue
// continuously): report the first failure, then at most one line per interval.
const ERROR_LOG_INTERVAL_MS = 10000;
const lastErrorLogAt = new Map();

function logErrorThrottled(prefix, message) {
  const now = Date.now();
  if (now - (lastErrorLogAt.get(prefix) || 0) < ERROR_LOG_INTERVAL_MS) return;
  lastErrorLogAt.set(prefix, now);
  console.warn(prefix, message);
}

// The client is created on demand and re-created after a close, so a
// stop → start cycle of the worker never ends up with a dead connection.
let redis = null;

function getClient() {
  if (!redis || redis.status === 'end') {
    redis = new Redis(env.REDIS_URL || 'redis://localhost:6379', {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });
    redis.on('error', (err) => {
      logErrorThrottled('[AI Queue Redis]', err.message);
    });
  }
  return redis;
}

const QUEUE_KEY = 'aura:ai:jobs';
export const DEAD_LETTER_KEY = 'aura:ai:jobs:dead';
// Keep the dead-letter list bounded — it is a diagnostic buffer, not a backup.
const DEAD_LETTER_MAX = 1000;

/**
 * Pushes an AI job to the Redis queue.
 */
export async function enqueueAIJob(jobType, payload) {
  const job = {
    id: `job:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`,
    type: jobType,
    payload,
    createdAt: new Date().toISOString(),
  };

  await getClient().rpush(QUEUE_KEY, JSON.stringify(job));
  return job.id;
}

/**
 * Pops and returns the next job from the queue (blocking pop).
 */
export async function dequeueAIJob(timeoutSeconds = 5) {
  try {
    const result = await getClient().blpop(QUEUE_KEY, timeoutSeconds);
    // A closed/reused connection can answer with something that is not a
    // [key, payload] pair — treat it as "no job" instead of crashing.
    if (!Array.isArray(result) || result.length < 2) return null;
    if (typeof result[1] !== 'string') return null;

    return JSON.parse(result[1]);
  } catch (err) {
    logErrorThrottled('[AI Queue Dequeue Error]', err.message);
    return null;
  }
}

/**
 * Moves a job that could not be processed to the dead-letter list.
 * The job is stored unchanged (same shape as the queue entry) so it can be
 * replayed later with a simple LINSERT/JSON.parse.
 */
export async function pushDeadLetterJob(job) {
  const client = getClient();
  await client.lpush(DEAD_LETTER_KEY, JSON.stringify(job));
  await client.ltrim(DEAD_LETTER_KEY, 0, DEAD_LETTER_MAX - 1);
  return job?.id ?? null;
}

/**
 * Closes the queue connection (graceful quit, forced disconnect on timeout).
 * The next queue call transparently opens a fresh connection.
 */
export async function closeAIQueue() {
  if (!redis) return;

  try {
    await Promise.race([
      redis.quit(),
      new Promise((resolve) => setTimeout(resolve, 1000)),
    ]);
  } catch (err) {
    console.warn('[AI Queue Redis] Graceful close skipped:', err.message);
  } finally {
    try {
      redis.disconnect();
    } catch {
      // Already closed — nothing to do.
    }
    redis = null;
  }
}

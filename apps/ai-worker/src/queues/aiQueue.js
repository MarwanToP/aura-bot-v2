import { Redis } from 'ioredis';
import { env } from '../../../../packages/config/src/env.js';

const redis = new Redis(env.REDIS_URL || 'redis://localhost:6379');
const QUEUE_KEY = 'aura:ai:jobs';

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

  await redis.rpush(QUEUE_KEY, JSON.stringify(job));
  return job.id;
}

/**
 * Pops and returns the next job from the queue (blocking pop).
 */
export async function dequeueAIJob(timeoutSeconds = 5) {
  const result = await redis.blpop(QUEUE_KEY, timeoutSeconds);
  if (!result) return null;

  const [_, jobData] = result;
  return JSON.parse(jobData);
}

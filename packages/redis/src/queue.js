import { Redis } from 'ioredis';
import { env } from '../../config/src/env.js';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
});

export const pubsubSubscriber = new Redis(env.REDIS_URL);
export const pubsubPublisher = new Redis(env.REDIS_URL);

const QUEUE_KEY = 'aura:ai:jobs';
export const ACTION_CHANNEL = 'aura:moderation:actions';

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

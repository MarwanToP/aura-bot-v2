import { Redis } from 'ioredis';
import { env } from '../../config/src/env.js';

const options = {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  lazyConnect: true,
};

export const redis = new Redis(env.REDIS_URL, options);
export const pubsubSubscriber = new Redis(env.REDIS_URL, options);
export const pubsubPublisher = new Redis(env.REDIS_URL, options);

redis.on('error', (err) => console.warn('[Redis Queue]', err.message));
pubsubSubscriber.on('error', (err) => console.warn('[Redis PubSub Sub]', err.message));
pubsubPublisher.on('error', (err) => console.warn('[Redis PubSub Pub]', err.message));

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

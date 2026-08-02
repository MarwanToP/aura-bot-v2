// ================================================================
//  @aura/redis — Upstash Redis Client & Atomic Cache Helpers
// ================================================================

import Redis from 'ioredis';
import logger from '@aura/logger';

const tlsEnabled = process.env.REDIS_TLS === 'true' || (process.env.REDIS_URL && process.env.REDIS_URL.includes('rediss://'));

const redisOptions = {
  retryStrategy: (t) => Math.min(t * 200, 5000),
  lazyConnect: true,
  keyPrefix: 'aura2:',
  ...(tlsEnabled && { tls: { rejectUnauthorized: false } }),
};

export const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, redisOptions)
  : new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0', 10),
      ...redisOptions,
    });

redis.on('connect', () => logger.info('Redis: Connected'));
redis.on('ready', () => logger.info('Redis: Ready'));
redis.on('error', (err) => logger.error('Redis error:', err.message));

// Helper methods for JSON & Atomic Rate Limits
redis.getJSON = async (key) => {
  const v = await redis.get(key);
  return v ? JSON.parse(v) : null;
};

redis.setJSON = async (key, value, ttl = null) => {
  const str = JSON.stringify(value);
  return ttl ? redis.setex(key, ttl, str) : redis.set(key, str);
};

/**
 * Atomic Rate Limiter using Redis Multi Transaction
 * Used for Discord command cooldowns and Web API rate limiting
 */
redis.incrementBounded = async (key, max, windowMs) => {
  const multi = redis.multi();
  multi.incr(key);
  multi.pexpire(key, windowMs);
  const results = await multi.exec();
  const count = results ? results[0][1] : 1;
  return { count, exceeded: count > max };
};

export default redis;

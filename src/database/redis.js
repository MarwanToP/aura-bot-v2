// ================================================================
//  Redis Client
// ================================================================
import Redis  from 'ioredis';
import logger from '../utils/logger.js';

const redis = new Redis({
  host:          process.env.REDIS_HOST     || 'localhost',
  port:          parseInt(process.env.REDIS_PORT) || 6379,
  password:      process.env.REDIS_PASSWORD || undefined,
  db:            parseInt(process.env.REDIS_DB)   || 0,
  retryStrategy: (t) => Math.min(t * 200, 5000),
  lazyConnect:   true,
  keyPrefix:     'aura2:',
});

redis.on('connect',      () => logger.info('Redis: Connected'));
redis.on('ready',        () => logger.info('Redis: Ready'));
redis.on('error',  (err) => logger.error('Redis error:', err.message));
redis.on('close',        () => logger.warn('Redis: Closed'));
redis.on('reconnecting', () => logger.info('Redis: Reconnecting...'));

redis.getJSON = async (key) => {
  const v = await redis.get(key);
  return v ? JSON.parse(v) : null;
};
redis.setJSON = async (key, value, ttl = null) => {
  const str = JSON.stringify(value);
  return ttl ? redis.setex(key, ttl, str) : redis.set(key, str);
};
redis.incrementBounded = async (key, max, windowMs) => {
  const multi   = redis.multi();
  multi.incr(key);
  multi.pexpire(key, windowMs);
  const results = await multi.exec();
  const count   = results[0][1];
  return { count, exceeded: count > max };
};

export default redis;

// ================================================================
//  @aura/redis — Upstash Redis Client & Atomic Cache Helpers
// ================================================================

import Redis from 'ioredis';
import logger from '@aura/logger';

const tlsEnabled = process.env.REDIS_TLS === 'true' || (process.env.REDIS_URL && process.env.REDIS_URL.includes('rediss://'));

// ── Bounded failure policy ────────────────────────────────────────────────
// Discord expects every command to be answered within ~3s. With the ioredis
// defaults (maxRetriesPerRequest: 20 plus an unbounded retryStrategy) the FIRST
// command against an unreachable Redis blocked for ~43s, so every command
// died with "The application did not respond.". The client now fails fast and
// hands the error to the caller, which can fail open or fall back to the DB:
//   • maxRetriesPerRequest: 2 → the offline queue is flushed after 2 tries
//   • connectTimeout: 5000    → a black-holed TCP connect cannot hang forever
//   • retryStrategy           → stops reconnecting after ~2 attempts
const redisOptions = {
  retryStrategy: (times) => (times > 2 ? null : Math.min(times * 200, 1000)),
  maxRetriesPerRequest: 2,
  connectTimeout: 5000,
  lazyConnect: true,
  keyPrefix: 'aura2:',
  ...(tlsEnabled && { tls: {} }),
};

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

// ioredis parses the connection string with `new URL()`, which throws for a
// malformed value — straight from the constructor, i.e. while this module is
// still being imported. The client is therefore built defensively: a broken
// REDIS_URL degrades to the host/port configuration instead of killing the
// process at import time.
function createClient() {
  const url = process.env.REDIS_URL;

  if (url) {
    try {
      return new Redis(url, redisOptions);
    } catch (err) {
      logger.error('Redis: invalid REDIS_URL, falling back to host/port —', err?.message);
    }
  }

  return new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: toInt(process.env.REDIS_PORT, 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    db: toInt(process.env.REDIS_DB, 0),
    ...redisOptions,
  });
}

// Last-resort client: rejects every command immediately instead of throwing
// while the module is imported. Only reachable if even the plain host/port
// client cannot be constructed (e.g. a broken ioredis install).
function createDeadClient() {
  const reject = (op) => () => Promise.reject(new Error(`Redis unavailable (${op})`));
  return {
    status: 'end',
    options: { keyPrefix: 'aura2:' },
    on() { return this; },
    once() { return this; },
    off() { return this; },
    connect: () => Promise.reject(new Error('Redis unavailable')),
    quit: () => Promise.resolve('OK'),
    disconnect() { return this; },
    get: reject('get'),
    set: reject('set'),
    setex: reject('setex'),
    del: reject('del'),
    ttl: reject('ttl'),
    incr: reject('incr'),
    pexpire: reject('pexpire'),
    multi() { throw new Error('Redis unavailable (multi)'); },
  };
}

export const redis = (() => {
  try {
    return createClient();
  } catch (err) {
    logger.error('Redis: client could not be created —', err?.message);
    try {
      return new Redis({ host: 'localhost', port: 6379, ...redisOptions });
    } catch {
      return createDeadClient();
    }
  }
})();

redis.on('connect', () => logger.info('Redis: Connected'));
redis.on('ready', () => logger.info('Redis: Ready'));
redis.on('error', (err) => logger.error(`Redis error: ${err?.message || err}`));

// The bounded retry strategy leaves the client in the terminal "end" state
// once an outage exhausts its attempts. Re-arm it lazily so a transient Redis
// hiccup does not disable the cache for the whole process lifetime. Every
// reconnect attempt is bounded by the options above, so this background work
// can never block a command.
let reconnectTimer = null;
redis.on('end', () => {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (redis.status !== 'end') return;
    if (redis.manuallyClosing) return; // the client was closed on purpose
    // Reset the retry counter so the new cycle gets the full attempt budget.
    if (typeof redis.retryAttempts === 'number') redis.retryAttempts = 0;
    redis.connect().catch((err) => logger.warn('Redis: reconnect failed —', err?.message));
  }, 10000);
  if (typeof reconnectTimer.unref === 'function') reconnectTimer.unref();
});

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

export * from './src/queue.js';


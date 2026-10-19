import { Redis } from 'ioredis';
import { env } from '../../config/src/env.js';

// ── Bounded failure policy ────────────────────────────────────────────────
// Mirrors the hardening already applied in packages/redis/index.js: a dead
// Redis must never stall the bot. With the ioredis defaults
// (maxRetriesPerRequest: 20 plus an unbounded retryStrategy) these clients
// kept reconnecting forever, the subscriber loop never settled, and the
// moderation-action subscriber gave up with "action subscriber disabled".
//   • maxRetriesPerRequest: 2 → the offline queue is flushed after 2 tries
//   • connectTimeout: 5000    → a black-holed TCP connect cannot hang forever
//   • retryStrategy           → stops reconnecting after ~2 attempts
//
// NOTE: these clients deliberately have NO keyPrefix. The AI worker reads the
// unprefixed "aura:ai:jobs" key and the bot subscribes to the unprefixed
// "aura:moderation:actions" channel — adding a prefix here would silently
// break both contracts.
const redisOptions = {
  retryStrategy: (times) => (times > 2 ? null : Math.min(times * 200, 1000)),
  maxRetriesPerRequest: 2,
  connectTimeout: 5000,
  enableReadyCheck: false,
  lazyConnect: true,
};

// Last-resort client: rejects every command immediately instead of throwing
// while the module is imported. Used when REDIS_URL is missing or malformed,
// so a broken configuration can never take the bot down at import time.
function createDeadClient() {
  const reject = (op) => () => Promise.reject(new Error(`Redis unavailable (${op})`));
  return {
    status: 'end',
    options: { ...redisOptions },
    on() { return this; },
    once() { return this; },
    off() { return this; },
    removeListener() { return this; },
    removeAllListeners() { return this; },
    listeners() { return []; },
    connect: reject('connect'),
    quit: () => Promise.resolve('OK'),
    disconnect() { return this; },
    rpush: reject('rpush'),
    blpop: reject('blpop'),
    publish: reject('publish'),
    // The subscriber callback receives the error, so the caller can fall back
    // to its own bounded retry instead of waiting for a connection that will
    // never arrive. The returned promise resolves — a rejected one nobody
    // awaits would surface as an unhandled rejection.
    subscribe(_channel, callback) {
      if (typeof callback === 'function') {
        setImmediate(() => callback(new Error('Redis unavailable (subscribe)')));
      }
      return Promise.resolve(0);
    },
  };
}

// ioredis parses the connection string with `new URL()`, which throws for a
// malformed value — straight from the constructor, i.e. while this module is
// still being imported. The clients are therefore built defensively: a broken
// REDIS_URL degrades to a dead client whose commands fail gracefully instead
// of killing the process at import time.
function createClient(label) {
  const url = env?.REDIS_URL;

  if (!url || typeof url !== 'string') {
    console.warn(`[Redis Queue] ${label}: no REDIS_URL configured — using a disabled client.`);
    return createDeadClient();
  }

  try {
    return new Redis(url, redisOptions);
  } catch (err) {
    console.warn(`[Redis Queue] ${label}: invalid REDIS_URL (${err?.message}) — using a disabled client.`);
    return createDeadClient();
  }
}

export const redis = createClient('queue');
export const pubsubSubscriber = createClient('pubsub subscriber');
export const pubsubPublisher = createClient('pubsub publisher');

redis.on('error', (err) => console.warn('[Redis Queue]', err.message));
pubsubSubscriber.on('error', (err) => console.warn('[Redis PubSub Sub]', err.message));
pubsubPublisher.on('error', (err) => console.warn('[Redis PubSub Pub]', err.message));

// The bounded retry strategy leaves a client in the terminal "end" state once
// an outage exhausts its attempts. Re-arm it lazily so a transient Redis
// hiccup (or a restart) does not disable the queue/pubsub for the whole
// process lifetime. Every reconnect attempt is bounded by the options above,
// so this background work can never block a command.
function armReconnect(client, label) {
  let reconnectTimer = null;

  client.on('end', () => {
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      if (client.status !== 'end') return;
      if (client.manuallyClosing) return; // the client was closed on purpose
      // Reset the retry counter so the new cycle gets the full attempt budget.
      if (typeof client.retryAttempts === 'number') client.retryAttempts = 0;
      client.connect().catch((err) => console.warn(`[Redis Queue] ${label}: reconnect failed —`, err?.message));
    }, 10000);
    if (typeof reconnectTimer.unref === 'function') reconnectTimer.unref();
  });
}

armReconnect(redis, 'queue');
armReconnect(pubsubSubscriber, 'pubsub subscriber');
armReconnect(pubsubPublisher, 'pubsub publisher');

const QUEUE_KEY = 'aura:ai:jobs';
export const ACTION_CHANNEL = 'aura:moderation:actions';

export async function enqueueAIJob(jobType, payload) {
  const job = {
    id: `job:${Date.now()}:${Math.random().toString(36).slice(2, 11)}`,
    type: jobType,
    payload,
    createdAt: new Date().toISOString(),
  };

  await redis.rpush(QUEUE_KEY, JSON.stringify(job));
  return job.id;
}

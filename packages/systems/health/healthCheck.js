// ================================================================
//  AURA BOT v2.0 — Shared Health Probes
//
//  Dependency-free probe helpers used by BOTH:
//    • the boot-time health check (apps/bot/src/index.js)
//    • the /doctor slash command (apps/bot/src/commands/utility/doctor.js)
//
//  Contract for every probe exported from this file:
//    • never throws — each probe catches its own failure
//    • never calls process.exit — a broken service must not kill the bot
//    • returns a plain, serializable result the caller renders
//
//  The probes intentionally degrade to "not exposed" instead of throwing
//  when a client stub does not implement the underlying API (the mock
//  harness in deploy/scripts/tests/test-all-commands.js ships a reduced
//  client.db / client.redis / client.ai).
// ================================================================

export const HEALTH_DEFAULTS = {
  dbTimeoutMs: 5000,
  redisTimeoutMs: 3000,
  maxMessageLength: 120,
};

/**
 * Resolve a promise with a hard timeout.
 * Rejects with a descriptive Error so callers can report "timed out".
 * @param {Promise<any>} promise
 * @param {number} ms
 * @param {string} label
 */
export function withTimeout(promise, ms, label = 'operation') {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    if (typeof timer?.unref === 'function') timer.unref();
  });
  return Promise.race([Promise.resolve(promise), timeout]).finally(() => clearTimeout(timer));
}

/**
 * Collapse whitespace and clip a message to `max` characters.
 * @param {any} text
 * @param {number} [max]
 * @returns {string}
 */
export function truncate(text, max = HEALTH_DEFAULTS.maxMessageLength) {
  if (text === null || text === undefined) return '';
  const raw = typeof text === 'string' ? text : (text?.message || String(text));
  const flat = String(raw).replace(/\s+/g, ' ').trim();
  const limit = Number.isFinite(max) && max > 0 ? max : HEALTH_DEFAULTS.maxMessageLength;
  if (flat.length <= limit) return flat;
  return `${flat.slice(0, Math.max(0, limit - 1))}…`;
}

/**
 * Build a human readable one-liner for an error.
 *
 * Sequelize/ioredis errors are frequently useless on their own: a refused
 * connection carries an EMPTY `message` and only the `name`/`parent.code`
 * tell the operator what actually happened. Missing-column errors, by
 * contrast, live in `message` and are reported verbatim (truncated only).
 *
 * @param {any} err
 * @returns {string}
 */
export function describeError(err) {
  if (err === null || err === undefined) return 'unknown error';
  if (typeof err === 'string') return err.trim() || 'unknown error';

  const message = typeof err.message === 'string' ? err.message.trim() : '';
  const parentMessage = typeof err.parent?.message === 'string' ? err.parent.message.trim() : '';
  const name = typeof err.name === 'string' ? err.name.trim() : '';
  const code = typeof err.code === 'string'
    ? err.code.trim()
    : (typeof err.parent?.code === 'string' ? err.parent.code.trim() : '');

  let base = message || parentMessage || name || 'unknown error';
  if (code && !base.includes(code)) base = `${base} (${code})`;
  if (!message && name && !base.includes(name)) base = `${base} (${name})`;
  return base;
}

/**
 * Human readable duration (e.g. "3d 4h 12m").
 * @param {number} ms
 */
export function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return 'unknown';
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days) return `${days}d ${hours}h ${minutes}m`;
  if (hours) return `${hours}h ${minutes}m`;
  if (minutes) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

/**
 * Resolve the bot uptime in milliseconds from whatever the client exposes.
 * @param {any} client
 * @returns {number|null}
 */
export function resolveUptimeMs(client) {
  try {
    if (typeof client?.uptime === 'number' && Number.isFinite(client.uptime)) {
      return client.uptime * 1000;
    }
    const readyTimestamp = client?.readyTimestamp ?? client?.ws?.readyTimestamp;
    if (typeof readyTimestamp === 'number' && Number.isFinite(readyTimestamp) && readyTimestamp > 0) {
      return Math.max(0, Date.now() - readyTimestamp);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Database probe — the single most valuable signal.
 *
 * 1. `client.db.authenticate()` with a short timeout (connection check)
 * 2. one real, read-only model query (proves the schema is usable and
 *    surfaces missing-column / missing-table errors verbatim)
 *
 * @param {any} client
 * @param {{ timeoutMs?: number, guildId?: string|null }} [options]
 */
export async function probeDatabase(client, { timeoutMs, guildId = null } = {}) {
  const ms = Number.isFinite(timeoutMs) ? timeoutMs : HEALTH_DEFAULTS.dbTimeoutMs;
  const result = {
    ok: false,
    connection: 'FAILED',
    connectionMessage: 'client.db is not attached',
    query: 'SKIPPED',
    queryMessage: 'database not attached',
  };

  try {
    const db = client?.db;
    if (!db) return result;

    // 1. Connection check
    if (typeof db.authenticate === 'function') {
      try {
        await withTimeout(db.authenticate(), ms, 'database authenticate');
        result.connection = 'OK';
        result.connectionMessage = 'connected';
      } catch (err) {
        result.connection = 'FAILED';
        result.connectionMessage = truncate(err?.message || 'connection failed', 160);
      }
    } else {
      result.connection = 'NOT EXPOSED';
      result.connectionMessage = 'authenticate() is not available on the client DB object';
    }

    // 2. Read-only schema probe
    const model = db.models?.GuildSettings;
    if (!model || typeof model.findOne !== 'function') {
      result.query = 'SKIPPED';
      result.queryMessage = 'GuildSettings model is not available';
      return result;
    }

    try {
      const row = await withTimeout(
        model.findOne({ where: { guildId: guildId ?? '__health_probe__' } }),
        ms,
        'schema query',
      );
      result.query = 'OK';
      result.queryMessage = row ? 'row found' : 'no row (schema reachable)';
    } catch (err) {
      result.query = 'FAILED';
      result.queryMessage = truncate(err?.message || 'query failed', 200);
    }

    result.ok = result.connection === 'OK' && result.query === 'OK';
    return result;
  } catch (err) {
    result.connectionMessage = truncate(err?.message || 'probe failed', 160);
    return result;
  }
}

/**
 * Redis probe — connection status plus an optional cheap PING round-trip.
 * @param {any} client
 * @param {{ timeoutMs?: number }} [options]
 */
export async function probeRedis(client, { timeoutMs } = {}) {
  const ms = Number.isFinite(timeoutMs) ? timeoutMs : HEALTH_DEFAULTS.redisTimeoutMs;
  const result = { ok: false, status: 'unknown', message: 'client.redis is not attached', pingMs: null };

  try {
    const redis = client?.redis;
    if (!redis) return result;

    const status = typeof redis.status === 'string' ? redis.status : 'unknown';
    result.status = status;

    if (status !== 'ready') {
      result.message = `status=${status}`;
      return result;
    }

    result.ok = true;
    if (typeof redis.ping === 'function') {
      const started = Date.now();
      try {
        const pong = await withTimeout(redis.ping(), ms, 'redis ping');
        result.pingMs = Date.now() - started;
        result.message = `ready • ping ${pong ?? 'PONG'} (${result.pingMs}ms)`;
      } catch (err) {
        result.ok = false;
        result.message = `ready • ping FAILED — ${truncate(err?.message, 90)}`;
      }
    } else {
      result.message = 'ready (ping not exposed)';
    }
    return result;
  } catch (err) {
    result.message = truncate(err?.message || 'probe failed', 120);
    return result;
  }
}

/**
 * AI provider probe.
 * @param {any} client
 */
export function probeAi(client) {
  const result = { ok: false, provider: null, message: 'client.ai is not attached' };
  try {
    const ai = client?.ai;
    if (!ai) return result;

    const available = typeof ai.isAvailable === 'function' ? Boolean(ai.isAvailable()) : false;
    result.ok = available;
    result.provider = ai.provider || ai.cloudflare?.model || ai.model || null;
    result.message = available ? 'available' : 'unavailable';
    return result;
  } catch (err) {
    result.message = truncate(err?.message || 'probe failed', 120);
    return result;
  }
}

/**
 * Command registry probe.
 * @param {any} client
 * @param {string[]} [wellKnown] names that should always be registered
 */
export function probeCommands(client, wellKnown = []) {
  const result = { total: 0, present: [], missing: [] };
  try {
    const commands = client?.commands;
    result.total = typeof commands?.size === 'number' ? commands.size : 0;

    if (Array.isArray(wellKnown) && wellKnown.length) {
      for (const name of wellKnown) {
        const has = typeof commands?.has === 'function'
          ? commands.has(name)
          : Boolean(commands?.[name]);
        if (has) result.present.push(name);
        else result.missing.push(name);
      }
    }
    return result;
  } catch {
    return result;
  }
}

/**
 * Boot-time health check.
 *
 * Runs every probe inside its own try/catch, logs the result through
 * `client.logger` (info for healthy, warn for degraded) and NEVER throws
 * and NEVER exits the process — a broken dependency must not prevent the
 * bot from booting and reporting the breakage to the admin.
 *
 * @param {any} client
 * @param {{ dbTimeoutMs?: number, redisTimeoutMs?: number }} [options]
 */
export async function runBootHealthCheck(client, options = {}) {
  const log = {
    info: (msg) => { try { client?.logger?.info?.(msg); } catch { /* logging must never throw */ } },
    warn: (msg) => { try { client?.logger?.warn?.(msg); } catch { /* logging must never throw */ } },
  };

  const dbTimeoutMs = Number.isFinite(options.dbTimeoutMs) ? options.dbTimeoutMs : 5000;
  const redisTimeoutMs = Number.isFinite(options.redisTimeoutMs) ? options.redisTimeoutMs : 3000;

  // Database + Redis run in parallel so a dead dependency cannot stack the
  // boot delay of two timeouts on top of each other.
  const [dbResult, redisResult] = await Promise.all([
    probeDatabase(client, { timeoutMs: dbTimeoutMs }).catch((err) => ({
      connection: 'FAILED',
      connectionMessage: truncate(err?.message, 160),
      query: 'SKIPPED',
      queryMessage: 'probe failed',
    })),
    probeRedis(client, { timeoutMs: redisTimeoutMs }).catch((err) => ({
      status: 'unknown',
      message: truncate(err?.message, 120),
    })),
  ]);

  if (dbResult.connection === 'OK') {
    log.info('[Health] Database: OK');
  } else {
    log.warn(`[Health] Database: FAILED — ${dbResult.connectionMessage}`);
  }
  if (dbResult.query === 'OK') {
    log.info('[Health] Database schema: OK');
  } else if (dbResult.query === 'FAILED') {
    log.warn(`[Health] Database schema: FAILED — ${dbResult.queryMessage}`);
  }

  if (redisResult.status === 'ready') {
    log.info(`[Health] Redis: OK (${redisResult.status})`);
  } else {
    log.warn(`[Health] Redis: ${redisResult.status}`);
  }

  let aiResult;
  try {
    aiResult = probeAi(client);
  } catch (err) {
    aiResult = { ok: false, message: truncate(err?.message, 120) };
  }
  if (aiResult.ok) {
    log.info('[Health] AI: OK');
  } else {
    log.warn('[Health] AI: unavailable');
  }

  return { db: dbResult, redis: redisResult, ai: aiResult };
}

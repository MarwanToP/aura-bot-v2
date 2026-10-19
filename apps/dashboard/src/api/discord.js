import { env } from '../../../../packages/config/src/env.js';

/**
 * Shared Discord REST helper for the dashboard API.
 *
 * All calls authenticate with the bot token (server-side only) so the
 * dashboard can surface real guild data even while the bot process itself
 * is not running. Responses are cached briefly to stay well within
 * Discord's REST rate limits.
 */

const API_BASE = 'https://discord.com/api/v10';
const CACHE_TTL_MS = 5 * 60 * 1000;

let guildCache = { at: 0, data: null };
// In-flight dedup: concurrent cold-cache callers share a single Discord fetch
// instead of each firing 13 REST requests. Cleared once the fetch settles, so
// failures are retried on the next call.
let guildFetchPromise = null;

export function hasBotToken() {
  const token = env.DISCORD_TOKEN;
  // Mirrors the placeholder heuristic in guildAuth.js: a missing token, a value
  // containing 'placeholder', or the .env.example literal counts as unconfigured.
  return Boolean(token) && token !== 'your_discord_bot_token_here' && !token.includes('placeholder');
}

export async function discordFetch(path, { timeout = 8000 } = {}) {
  if (!hasBotToken()) {
    const err = new Error('Bot token not configured');
    err.status = 503;
    throw err;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bot ${env.DISCORD_TOKEN}` },
    signal: AbortSignal.timeout(timeout),
  });

  if (!res.ok) {
    const err = new Error(`Discord API error ${res.status} for ${path}`);
    err.status = res.status;
    throw err;
  }

  return res.json();
}

/**
 * Guilds the bot is a member of, enriched with approximate member counts
 * (first 12 guilds; the rest are returned without counts). Cached 5 minutes.
 */
async function fetchBotGuilds() {
  const list = await discordFetch('/users/@me/guilds');
  const detailed = await Promise.allSettled(
    list.slice(0, 12).map((g) => discordFetch(`/guilds/${g.id}?with_counts=true`))
  );

  const guilds = list.map((g, i) => {
    const full = i < 12 && detailed[i].status === 'fulfilled' ? detailed[i].value : null;
    return {
      id: g.id,
      name: g.name,
      icon: g.icon || null,
      memberCount: full?.approximate_member_count ?? null,
      onlineCount: full?.approximate_presence_count ?? null,
    };
  });

  guildCache = { at: Date.now(), data: guilds };
  return guilds;
}

export async function getBotGuilds() {
  if (guildCache.data && Date.now() - guildCache.at < CACHE_TTL_MS) {
    return guildCache.data;
  }

  guildFetchPromise ??= fetchBotGuilds().finally(() => {
    guildFetchPromise = null;
  });

  return guildFetchPromise;
}

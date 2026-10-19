/**
 * Verifies that an authenticated user has Administrative/Manage Guild permissions
 * for the requested guildId parameter before granting access to server routes.
 *
 * Implementation per project spec (§4.A Authorization & IDOR Protection):
 * the member's guild roles are resolved against the guild's role list using the
 * bot token, OR'd with the @everyone role bits, and checked for ADMINISTRATOR or
 * MANAGE_GUILD. The guild owner is always allowed (verified via the guild's
 * owner_id). The Discord REST member object does not include computed
 * permissions, so they must be derived from roles here.
 * Results are cached in-memory for 5 minutes to stay well within API rate limits.
 * Fails closed: on any API error the request is rejected.
 */
import { env } from '../../../../packages/config/src/env.js';
import { isDevAuth } from './auth.js';

const ADMINISTRATOR = 0x8n;
const MANAGE_GUILD = 0x20n;
const CACHE_TTL_MS = 5 * 60 * 1000;

// key: `${guildId}:${userId}` -> { allowed: boolean, expires: number }
const permCache = new Map();
// key: guildId -> { ownerId, everyonePerms, rolePerms, expires }
const guildMetaCache = new Map();

function authHeaders() {
  return { Authorization: `Bot ${env.DISCORD_TOKEN}` };
}

async function getGuildMeta(guildId) {
  const cached = guildMetaCache.get(guildId);
  if (cached && cached.expires > Date.now()) return cached;

  const [guildRes, rolesRes] = await Promise.all([
    fetch(`https://discord.com/api/v10/guilds/${guildId}`, {
      headers: authHeaders(),
      signal: AbortSignal.timeout(5000),
    }),
    fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
      headers: authHeaders(),
      signal: AbortSignal.timeout(5000),
    }),
  ]);

  if (!guildRes.ok || !rolesRes.ok) return null;

  const guild = await guildRes.json();
  const roles = await rolesRes.json();

  const meta = {
    ownerId: guild.owner_id,
    everyonePerms: 0n,
    rolePerms: new Map(),
    expires: Date.now() + CACHE_TTL_MS,
  };
  for (const role of roles) {
    const bits = BigInt(role.permissions || '0');
    meta.rolePerms.set(role.id, bits);
    if (role.id === guildId) meta.everyonePerms = bits; // @everyone role id === guild id
  }

  guildMetaCache.set(guildId, meta);
  return meta;
}

export async function userCanManageGuild(userId, guildId) {
  if (isDevAuth() && (guildId === '123456789012345678' || !env.DISCORD_TOKEN || env.DISCORD_TOKEN.includes('placeholder'))) {
    return true;
  }

  const cacheKey = `${guildId}:${userId}`;
  const cached = permCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.allowed;
  }

  const memberRes = await fetch(
    `https://discord.com/api/v10/guilds/${guildId}/members/${userId}`,
    {
      headers: authHeaders(),
      signal: AbortSignal.timeout(5000),
    }
  );

  if (!memberRes.ok) {
    // Not a member / bot not in guild / token problem -> deny, but don't cache failures
    return false;
  }

  const member = await memberRes.json();
  const meta = await getGuildMeta(guildId);
  if (!meta) {
    // Could not resolve guild roles -> deny, but don't cache failures
    return false;
  }

  // Fetching the member succeeded, so the user is in the guild. The owner always manages.
  let allowed = meta.ownerId === userId;
  if (!allowed) {
    // Compute base (guild-level) permissions: @everyone bits OR'd with the member's roles.
    let permissions = meta.everyonePerms;
    for (const roleId of member.roles || []) {
      permissions |= (meta.rolePerms.get(roleId) ?? 0n);
    }

    allowed =
      (permissions & ADMINISTRATOR) === ADMINISTRATOR ||
      (permissions & MANAGE_GUILD) === MANAGE_GUILD;
  }

  if (permCache.size > 5000) permCache.clear();
  permCache.set(cacheKey, { allowed, expires: Date.now() + CACHE_TTL_MS });
  return allowed;
}

export async function requireGuildAdmin(req, res, next) {
  const guildId = req.params.guildId || req.params[0];

  if (!guildId || !/^\d{17,20}$/.test(guildId)) {
    return res.status(400).json({ error: 'Invalid or missing Guild ID format' });
  }

  if (!req.user?.id) {
    return res.status(401).json({ error: 'Unauthorized: No active user session' });
  }

  try {
    const allowed = await userCanManageGuild(req.user.id, guildId);
    if (!allowed) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to manage this guild' });
    }
  } catch (err) {
    console.error('❌ [GuildAuth] Permission check failed:', err.message);
    return res.status(403).json({ error: 'Forbidden: Unable to verify guild permissions' });
  }

  req.guildId = guildId;
  next();
}

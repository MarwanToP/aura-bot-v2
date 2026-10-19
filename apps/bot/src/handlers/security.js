import { PermissionsBitField } from 'discord.js';

// Verify user administrative / member permissions
export function hasPermissions(member, requiredPermissions = []) {
  if (!requiredPermissions.length) return true;
  // Member-dependent gate: without a member (e.g. DM context) it cannot be
  // evaluated, so deny safely instead of throwing on `member.permissions`.
  if (!member?.permissions) return false;
  if (member.permissions.has(PermissionsBitField.Flags.Administrator)) return true;

  return requiredPermissions.every((perm) => member.permissions.has(perm));
}

// Enforce per-user command cooldowns using Redis
//
// The gate must never make a command hang: Discord expects an answer within
// ~3s, and an unreachable Redis used to block the read for the full client
// retry budget (~43s), which surfaced as "The application did not respond.".
// The whole gate is therefore bounded by a short timeout and FAILS OPEN on a
// timeout or a Redis error — a cooldown is a UX guard, not an authorization
// control, so an unavailable cache must not block the command.
const COOLDOWN_TIMEOUT_MS = 1500;

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Redis timeout during ${label}`)), ms);
    if (typeof timer.unref === 'function') timer.unref();
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function runCooldownGate(redisClient, key, cooldownSeconds) {
  const current = await redisClient.get(key);

  if (current) {
    const ttl = await redisClient.ttl(key);
    return { limited: true, retryAfter: ttl };
  }

  await redisClient.set(key, '1', 'EX', cooldownSeconds);
  return { limited: false, retryAfter: 0 };
}

export async function checkCooldown(redisClient, userId, commandName, cooldownSeconds = 3) {
  const key = `cooldown:${userId}:${commandName}`;

  try {
    return await withTimeout(
      runCooldownGate(redisClient, key, cooldownSeconds),
      COOLDOWN_TIMEOUT_MS,
      'cooldown check',
    );
  } catch {
    // Fail open: without a reachable cache we cannot know whether the user is
    // on cooldown, so the command is allowed to run.
    return { limited: false, retryAfter: 0 };
  }
}

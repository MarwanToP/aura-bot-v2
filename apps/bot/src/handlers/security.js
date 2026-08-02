import { PermissionsBitField } from 'discord.js';

// Verify user administrative / member permissions
export function hasPermissions(member, requiredPermissions = []) {
  if (!requiredPermissions.length) return true;
  if (member.permissions.has(PermissionsBitField.Flags.Administrator)) return true;

  return requiredPermissions.every((perm) => member.permissions.has(perm));
}

// Enforce per-user command cooldowns using Redis
export async function checkCooldown(redisClient, userId, commandName, cooldownSeconds = 3) {
  const key = `cooldown:${userId}:${commandName}`;
  const current = await redisClient.get(key);

  if (current) {
    const ttl = await redisClient.ttl(key);
    return { limited: true, retryAfter: ttl };
  }

  await redisClient.set(key, '1', 'EX', cooldownSeconds);
  return { limited: false, retryAfter: 0 };
}

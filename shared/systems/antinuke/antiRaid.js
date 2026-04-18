// ================================================================
//  Anti-Raid System v2
// ================================================================
import { buildEmbed } from '../../utils/embedBuilder.js';
import config         from '../../../config/config.js';
import logger         from '../../utils/logger.js';

export async function trackJoin(client, member) {
  const key     = `raid:joins:${member.guild.id}`;
  const window  = config.antiNuke.joinRaidThreshold.window * 1000;
  const { count } = await client.redis.incrementBounded(key, config.antiNuke.joinRaidThreshold.count, window);

  const memberKey = `raid:members:${member.guild.id}`;
  const existing  = await client.redis.getJSON(memberKey) || [];
  existing.push({ id: member.id, createdAt: member.user.createdTimestamp, username: member.user.username, joinedAt: Date.now() });
  await client.redis.setJSON(memberKey, existing.slice(-50), window / 1000);

  if (count >= config.antiNuke.joinRaidThreshold.count) {
    const analysis = analyzePattern(existing);
    const score    = calcScore(analysis);
    if (score >= 60) await activateLockdown(client, member.guild, `Auto-detected raid (score: ${score}/100)`);
  }
}

function analyzePattern(joins) {
  const now = Date.now(), w = 30000;
  const recent = joins.filter(j => now - j.joinedAt < w);
  const ages   = recent.map(j => (now - j.createdAt) / 86400000);
  const similar = countSimilar(recent.map(j => j.username.toLowerCase()));
  return { velocity: recent.length, newAccountRatio: ages.filter(a => a < 7).length / (recent.length || 1), avgAge: ages.reduce((a,b) => a+b, 0) / (ages.length || 1), similar };
}

function calcScore(a) {
  let s = 0;
  if (a.velocity >= 10) s += 40; else if (a.velocity >= 7) s += 25; else if (a.velocity >= 5) s += 15;
  if (a.newAccountRatio >= 0.8) s += 30; else if (a.newAccountRatio >= 0.5) s += 20;
  if (a.similar >= 3) s += 20; else if (a.similar >= 2) s += 10;
  if (a.avgAge < 1) s += 10; else if (a.avgAge < 3) s += 5;
  return Math.min(s, 100);
}

function countSimilar(names) {
  let n = 0;
  for (let i = 0; i < names.length; i++)
    for (let j = i+1; j < names.length; j++)
      if (lev(names[i], names[j]) <= 3) n++;
  return n;
}

function lev(a, b) {
  const m = Array.from({ length: b.length+1 }, (_, i) => [i]);
  m[0] = Array.from({ length: a.length+1 }, (_, i) => i);
  for (let i = 1; i <= b.length; i++)
    for (let j = 1; j <= a.length; j++)
      m[i][j] = b[i-1] === a[j-1] ? m[i-1][j-1] : Math.min(m[i-1][j-1]+1, m[i][j-1]+1, m[i-1][j]+1);
  return m[b.length][a.length];
}

export async function activateLockdown(client, guild, reason = 'Manual') {
  const key = `lockdown:${guild.id}`;
  await client.redis.setex(key, 3600, '1');
  logger.warn(`[AntiRaid] Lockdown in ${guild.name}: ${reason}`);

  try {
    const invites = await guild.invites.fetch().catch(() => null);
    if (invites) for (const inv of invites.values()) await inv.delete('[Aura Lockdown]').catch(() => {});
    for (const ch of guild.channels.cache.values()) {
      if (!ch.isTextBased()) continue;
      await ch.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false }, { reason: `[Aura Lockdown] ${reason}` }).catch(() => {});
    }
  } catch {}

  const { GuildSettings } = client.db.models;
  const settings = await GuildSettings.findOne({ where: { guildId: guild.id } }).catch(() => null);
  const channelId = settings?.auditLogChannelId || settings?.modLogChannelId;
  if (channelId) {
    const ch = await client.channels.fetch(channelId).catch(() => null);
    if (ch?.isTextBased()) await ch.send({ embeds: [buildEmbed({ type: 'error', title: '🚨 Lockdown Activated', description: reason, timestamp: true })] });
  }
}

export async function liftLockdown(client, guild, executor) {
  await client.redis.del(`lockdown:${guild.id}`);
  for (const ch of guild.channels.cache.values()) {
    if (!ch.isTextBased()) continue;
    await ch.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: null }, { reason: `[Aura Lockdown Lifted] by ${executor.tag}` }).catch(() => {});
  }
  logger.info(`[AntiRaid] Lockdown lifted in ${guild.name} by ${executor.tag}`);
}

export async function isInLockdown(client, guildId) {
  return !!(await client.redis.get(`lockdown:${guildId}`));
}

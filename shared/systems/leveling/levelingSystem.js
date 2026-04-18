// ================================================================
//  Leveling System — XP, Levels, Rank Cards, Leaderboard
// ================================================================
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { AttachmentBuilder }       from 'discord.js';
import config                      from '../../config/config.js';
import logger                      from '../../utils/logger.js';

export function xpForLevel(level) { return config.leveling.levelFormula(level); }

export function levelFromXp(xp) {
  let level = 0, remaining = xp;
  while (remaining >= xpForLevel(level)) { remaining -= xpForLevel(level); level++; }
  return { level, currentXp: remaining, nextLevelXp: xpForLevel(level) };
}

function randomXp() {
  const { min, max } = config.leveling.xpPerMessage;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function awardMessageXp(client, message) {
  if (!message.guild || message.author.bot) return;
  try {
    const coolKey = `xpcool:${message.guild.id}:${message.author.id}`;
    if (await client.redis.get(coolKey)) return;

    const { GuildSettings, UserProfile } = client.db.models;
    const settings = await GuildSettings.findOne({ where: { guildId: message.guild.id } });
    if (!settings?.levelingEnabled) return;

    const earned = Math.floor(randomXp() * (settings.xpMultiplier || 1));
    const [profile] = await UserProfile.findOrCreate({
      where: { userId: message.author.id, guildId: message.guild.id },
      defaults: { xp: 0, level: 0, totalMessages: 0 },
    });

    const oldLevel = profile.level;
    const newXp    = BigInt(profile.xp) + BigInt(earned);
    const { level: newLevel } = levelFromXp(Number(newXp));

    await profile.update({ xp: newXp, level: newLevel, totalMessages: BigInt(profile.totalMessages) + 1n, lastXpAt: new Date() });
    await client.redis.setex(coolKey, Math.ceil(config.leveling.xpCooldown / 1000), '1');

    if (newLevel > oldLevel) await handleLevelUp(client, message, newLevel, settings);
  } catch (err) {
    logger.debug('[Leveling]', err.message);
  }
}

async function handleLevelUp(client, message, newLevel, settings) {
  try {
    const lang       = await client.i18n.resolveLanguage(client, message.author.id, message.guild.id);
    const msg        = (settings.levelUpMessage || client.i18n.t('leveling.levelUp', { user: `<@${message.author.id}>`, level: newLevel }, lang))
      .replace('{user}', `<@${message.author.id}>`).replace('{level}', newLevel);

    const channelId  = settings.levelUpChannelId || message.channel.id;
    const channel    = await client.channels.fetch(channelId).catch(() => message.channel);
    await channel.send({ content: msg });

    // Level role rewards
    const { LevelReward } = client.db.models;
    const rewards = await LevelReward.findAll({ where: { guildId: message.guild.id }, order: [['level', 'DESC']] });
    for (const r of rewards) {
      if (newLevel >= r.level) {
        const role = message.guild.roles.cache.get(r.roleId);
        if (role && !message.member.roles.cache.has(role.id)) {
          await message.member.roles.add(role, `[Aura] Level ${r.level} reward`).catch(() => {});
        }
        if (r.removeOnNext) {
          const lower = rewards.filter(x => x.level < r.level);
          for (const l of lower) {
            if (message.member.roles.cache.has(l.roleId)) await message.member.roles.remove(l.roleId).catch(() => {});
          }
        }
        break;
      }
    }
  } catch (err) {
    logger.debug('[LevelUp]', err.message);
  }
}

export async function awardVoiceXp(client, guildId, userId, minutes) {
  try {
    const { GuildSettings, UserProfile } = client.db.models;
    const settings = await GuildSettings.findOne({ where: { guildId } });
    if (!settings?.levelingEnabled) return;

    const earned = Math.floor(config.leveling.xpPerMinVoice * minutes * (settings.xpMultiplier || 1));
    if (earned <= 0) return;

    const [profile] = await UserProfile.findOrCreate({ where: { userId, guildId }, defaults: { xp: 0, level: 0 } });
    const newXp     = BigInt(profile.xp) + BigInt(earned);
    const { level: newLevel } = levelFromXp(Number(newXp));
    await profile.update({ xp: newXp, level: newLevel, voiceMinutes: BigInt(profile.voiceMinutes) + BigInt(minutes) });
  } catch {}
}

export async function getLeaderboard(client, guildId, limit = 10, offset = 0) {
  try {
    const { UserProfile } = client.db.models;
    return UserProfile.findAll({ where: { guildId }, order: [['xp', 'DESC']], limit, offset });
  } catch { return []; }
}

export async function getUserRank(client, guildId, userId) {
  try {
    const result = await client.db.query(
      `SELECT COUNT(*)+1 AS rank FROM "user_profiles" WHERE "guildId"=:g AND "xp">(SELECT "xp" FROM "user_profiles" WHERE "guildId"=:g AND "userId"=:u LIMIT 1)`,
      { replacements: { g: guildId, u: userId }, type: client.db.QueryTypes?.SELECT || 'SELECT' }
    );
    return Number(result[0]?.rank ?? 0);
  } catch { return 0; }
}

// ─── Canvas Rank Card ─────────────────────────────────────────
export async function generateRankCard(member, profile, rank) {
  try {
    const canvas = createCanvas(1000, 280);
    const ctx    = canvas.getContext('2d');
    const xp     = Number(profile.xp);
    const { level, currentXp, nextLevelXp } = levelFromXp(xp);
    const progress = Math.min(currentXp / nextLevelXp, 1);

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 1000, 280);
    bg.addColorStop(0, '#0d1117');
    bg.addColorStop(1, '#161b22');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1000, 280);

    // Glow border
    ctx.strokeStyle = profile.cardColor || '#5865F2';
    ctx.lineWidth   = 3;
    ctx.strokeRect(10, 10, 980, 260);

    // Avatar
    const avatarUrl = member.user.displayAvatarURL({ size: 256, extension: 'png' });
    const avatar    = await loadImage(avatarUrl).catch(() => null);
    if (avatar) {
      ctx.save();
      ctx.beginPath(); ctx.arc(130, 140, 90, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
      ctx.drawImage(avatar, 40, 50, 180, 180);
      ctx.restore();
      // Ring
      ctx.beginPath(); ctx.arc(130, 140, 93, 0, Math.PI * 2);
      ctx.strokeStyle = profile.cardColor || '#5865F2'; ctx.lineWidth = 4; ctx.stroke();
    }

    // Username
    ctx.font      = 'bold 38px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(member.user.username.slice(0, 18), 260, 100);

    // Rank & Level badges
    ctx.font = 'bold 26px sans-serif';
    ctx.fillStyle = '#8b949e';
    ctx.fillText(`RANK`, 260, 145);
    ctx.fillStyle = profile.cardColor || '#5865F2';
    ctx.font = 'bold 42px sans-serif';
    ctx.fillText(`#${rank}`, 330, 148);

    ctx.font = 'bold 26px sans-serif';
    ctx.fillStyle = '#8b949e';
    ctx.fillText(`LEVEL`, 480, 145);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px sans-serif';
    ctx.fillText(`${level}`, 560, 148);

    // XP text
    ctx.font = '22px sans-serif';
    ctx.fillStyle = '#8b949e';
    ctx.fillText(`${currentXp.toLocaleString()} / ${nextLevelXp.toLocaleString()} XP`, 260, 185);

    // Progress bar background
    ctx.fillStyle = '#2d333b';
    ctx.beginPath(); ctx.roundRect(260, 205, 700, 30, 15); ctx.fill();

    // Progress bar fill
    const barWidth = Math.max(30, 700 * progress);
    const grad     = ctx.createLinearGradient(260, 0, 960, 0);
    grad.addColorStop(0,   profile.cardColor || '#5865F2');
    grad.addColorStop(1,   '#eb459e');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.roundRect(260, 205, barWidth, 30, 15); ctx.fill();

    // Total XP
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#8b949e';
    ctx.fillText(`Total: ${xp.toLocaleString()} XP`, 260, 255);
    ctx.fillText(`Messages: ${Number(profile.totalMessages).toLocaleString()}`, 500, 255);
    ctx.fillText(`Voice: ${Number(profile.voiceMinutes).toLocaleString()}min`, 740, 255);

    return new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'rank.png' });
  } catch (err) {
    logger.warn('[Leveling] generateRankCard:', err.message);
    return null;
  }
}

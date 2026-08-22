import { AttachmentBuilder }       from 'discord.js';
import { existsSync }              from 'fs';
import { join, dirname }           from 'path';
import { fileURLToPath }           from 'url';
import config                      from '../../config/config.js';
import logger                      from '../../utils/logger.js';
import { buildEmbed }              from '../../utils/embedBuilder.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
let createCanvas = null;
let loadImage = null;

try {
  ({ createCanvas, loadImage } = await import('@napi-rs/canvas'));
} catch {
  createCanvas = null;
  loadImage = null;
}

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

/**
 * Calculates exponential XP decay for inactive members.
 * Formula: decayedXp = rawXp * exp(-lambda * max(0, daysInactive - graceDays))
 * where lambda = ln(2) / halfLifeDays
 */
export function calculateDecayedXp(currentXp, lastXpAt, gracePeriodDays = 7, halfLifeDays = 14) {
  const xpNum = Number(currentXp || 0);
  if (!lastXpAt || xpNum <= 0) return BigInt(currentXp || 0);

  const inactiveDays = (Date.now() - new Date(lastXpAt).getTime()) / (1000 * 60 * 60 * 24);
  const grace = Number(gracePeriodDays ?? 7);
  if (inactiveDays <= grace) return BigInt(currentXp || 0);

  const activeDecayDays = inactiveDays - grace;
  const halfLife = Math.max(0.1, Number(halfLifeDays ?? 14));
  const lambda = Math.LN2 / halfLife;
  const decayed = xpNum * Math.exp(-lambda * activeDecayDays);
  return BigInt(Math.max(0, Math.floor(decayed)));
}

export function applyXpDecay(currentXp, lastXpAt, gracePeriodDays = 7, halfLifeDays = 14) {
  return calculateDecayedXp(currentXp, lastXpAt, gracePeriodDays, halfLifeDays);
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

    // Apply XP Decay if user was inactive before this message
    const graceDays = settings?.xpDecayGraceDays ?? 7;
    const halfLifeDays = settings?.xpDecayHalfLifeDays ?? 14;
    const decayEnabled = settings?.xpDecayEnabled ?? true;

    const decayedXp = decayEnabled ? applyXpDecay(profile.xp, profile.lastXpAt, graceDays, halfLifeDays) : BigInt(profile.xp);
    const newXp    = decayedXp + BigInt(earned);
    const { level: newLevel } = levelFromXp(Number(newXp));

    await profile.update({ xp: newXp, level: newLevel, totalMessages: BigInt(profile.totalMessages) + 1n, lastXpAt: new Date() });
    await client.redis.setex(coolKey, Math.ceil(config.leveling.xpCooldown / 1000), '1');

    if (newLevel > oldLevel) await handleLevelUp(client, message, oldLevel, newLevel, settings);
  } catch (err) {
    logger.debug('[Leveling]', err.message);
  }
}


async function handleLevelUp(client, message, oldLevel, newLevel, settings) {
  try {
    const channelId = settings.levelUpChannelId || message.channel.id;
    const channel   = await client.channels.fetch(channelId).catch(() => message.channel);

    const bannerPath = join(__dirname, '../../../dashboard/public/assets/banner_levelup.png');
    const files = [];
    
    const embedOpts = {
      type: 'level',
      title: 'LEVEL UP SHIFT!',
      description: `🎉 **Congratulations <@${message.author.id}>!** You have leveled up!`,
      fields: [
        { name: '📈 Level Shift', value: `\`Level ${oldLevel}\` ➔ \`Level ${newLevel}\``, inline: true },
        { name: '⭐ XP Threshold', value: `\`${xpForLevel(newLevel).toLocaleString()} XP Needed\``, inline: true },
      ],
      thumbnail: message.author.displayAvatarURL({ extension: 'png', dynamic: true, size: 256 }),
      color: '#FFD700',
      timestamp: true,
    };

    if (existsSync(bannerPath)) {
      files.push(new AttachmentBuilder(bannerPath, { name: 'banner_levelup.png' }));
      embedOpts.image = 'attachment://banner_levelup.png';
    }

    const embed = buildEmbed(embedOpts);

    // Level role rewards check & unlock summary
    const { LevelReward } = client.db.models;
    const rewards = await LevelReward.findAll({ where: { guildId: message.guild.id }, order: [['level', 'DESC']] });
    let unlockedRoleName = null;

    for (const r of rewards) {
      if (newLevel >= r.level) {
        const role = message.guild.roles.cache.get(r.roleId);
        if (role && !message.member.roles.cache.has(role.id)) {
          await message.member.roles.add(role, `[Aura] Level ${r.level} reward`).catch(() => {});
          unlockedRoleName = role.name;
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

    if (unlockedRoleName) {
      embed.addFields({ name: '👑 Unlocked Reward', value: `\`@${unlockedRoleName}\``, inline: false });
    }

    await channel.send({ content: `<@${message.author.id}>`, embeds: [embed], files });
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
    const graceDays = settings?.xpDecayGraceDays ?? 7;
    const halfLifeDays = settings?.xpDecayHalfLifeDays ?? 14;
    const decayEnabled = settings?.xpDecayEnabled ?? true;

    const decayedXp = decayEnabled ? applyXpDecay(profile.xp, profile.lastXpAt, graceDays, halfLifeDays) : BigInt(profile.xp);
    const newXp     = decayedXp + BigInt(earned);
    const { level: newLevel } = levelFromXp(Number(newXp));
    await profile.update({ xp: newXp, level: newLevel, voiceMinutes: BigInt(profile.voiceMinutes) + BigInt(minutes) });
  } catch {}
}

export async function getLeaderboard(client, guildId, limit = 10, offset = 0) {
  try {
    const { UserProfile, GuildSettings } = client.db.models;
    const settings = await GuildSettings.findOne({ where: { guildId } });
    const graceDays = settings?.xpDecayGraceDays ?? 7;
    const halfLifeDays = settings?.xpDecayHalfLifeDays ?? 14;
    const decayEnabled = settings?.xpDecayEnabled ?? true;

    const profiles = await UserProfile.findAll({ where: { guildId } });
    
    const decorated = profiles.map(p => {
      const activeXp = decayEnabled ? applyXpDecay(p.xp, p.lastXpAt, graceDays, halfLifeDays) : BigInt(p.xp);
      const { level: activeLevel } = levelFromXp(Number(activeXp));
      return {
        ...p.toJSON(),
        xp: activeXp,
        level: activeLevel,
      };
    });

    decorated.sort((a, b) => {
      if (b.xp > a.xp) return 1;
      if (b.xp < a.xp) return -1;
      return 0;
    });

    return decorated.slice(offset, offset + limit);
  } catch (err) {
    logger.debug('[Leveling] getLeaderboard:', err?.message);
    return [];
  }
}

export async function getUserRank(client, guildId, userId) {
  try {
    const { UserProfile, GuildSettings } = client.db.models;
    const settings = await GuildSettings.findOne({ where: { guildId } });
    const graceDays = settings?.xpDecayGraceDays ?? 7;
    const halfLifeDays = settings?.xpDecayHalfLifeDays ?? 14;
    const decayEnabled = settings?.xpDecayEnabled ?? true;

    const profiles = await UserProfile.findAll({ where: { guildId } });
    let targetXp = null;

    const decorated = profiles.map(p => {
      const activeXp = decayEnabled ? applyXpDecay(p.xp, p.lastXpAt, graceDays, halfLifeDays) : BigInt(p.xp);
      if (p.userId === userId) targetXp = activeXp;
      return { userId: p.userId, activeXp };
    });

    if (targetXp === null) return 0;

    let higherCount = 0;
    for (const item of decorated) {
      if (item.activeXp > targetXp) higherCount++;
    }
    return higherCount + 1;
  } catch (err) {
    logger.debug('[Leveling] getUserRank:', err?.message);
    return 0;
  }
}

export async function recalculateGuildRanks(client, guildId) {
  try {
    const { GuildSettings, UserProfile, LevelReward } = client.db.models;
    const settings = await GuildSettings.findOne({ where: { guildId } });
    if (settings && !settings.levelingEnabled) return;

    const rewards = await LevelReward.findAll({ where: { guildId }, order: [['level', 'DESC']] });
    if (!rewards || rewards.length === 0) return;

    const guild = client.guilds.cache.get(guildId) || await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) return;

    const profiles = await UserProfile.findAll({ where: { guildId } });
    const graceDays = settings?.xpDecayGraceDays ?? 7;
    const halfLifeDays = settings?.xpDecayHalfLifeDays ?? 14;
    const decayEnabled = settings?.xpDecayEnabled ?? true;

    const allRewardRoleIds = new Set(rewards.map(r => r.roleId));

    for (const profile of profiles) {
      const activeXp = decayEnabled ? applyXpDecay(profile.xp, profile.lastXpAt, graceDays, halfLifeDays) : BigInt(profile.xp);
      const { level: activeLevel } = levelFromXp(Number(activeXp));

      if (Number(profile.level) !== activeLevel) {
        await profile.update({ level: activeLevel }).catch(() => {});
      }

      const member = await guild.members.fetch(profile.userId).catch(() => null);
      if (!member) continue;

      const expectedRoleIds = new Set();
      const matchingRewards = rewards.filter(r => r.level <= activeLevel);
      if (matchingRewards.length > 0) {
        for (const r of matchingRewards) {
          expectedRoleIds.add(r.roleId);
          if (r.removeOnNext) break;
        }
      }

      for (const roleId of allRewardRoleIds) {
        const hasRole = member.roles.cache.has(roleId);
        const shouldHave = expectedRoleIds.has(roleId);

        if (shouldHave && !hasRole) {
          await member.roles.add(roleId, '[Aura Time-Decay] Rank role promotion').catch(() => {});
        } else if (!shouldHave && hasRole) {
          await member.roles.remove(roleId, '[Aura Time-Decay] Rank role demotion').catch(() => {});
        }
      }
    }
  } catch (err) {
    logger.debug('[Leveling] recalculateGuildRanks:', err?.message);
  }
}

// ─── Canvas Rank Card ─────────────────────────────────────────
export async function generateRankCard(member, profile, rank) {
  try {
    if (!createCanvas || !loadImage) return null;
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

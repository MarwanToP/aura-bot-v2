// ================================================================
//  Welcome System v2 — Canvas Cards + AI Messages
// ================================================================
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { AttachmentBuilder }       from 'discord.js';
import logger                      from '../../utils/logger.js';

export async function handleMemberJoin(client, member) {
  try {
    const { GuildSettings } = client.db.models;
    const settings = await GuildSettings.findOne({ where: { guildId: member.guild.id } });
    if (!settings?.welcomeEnabled) return;

    const lang  = settings.language || 'en';
    const count = member.guild.memberCount;
    const channel = await client.channels.fetch(settings.welcomeChannelId).catch(() => null);

    if (channel?.isTextBased()) {
      // AI-generated or template message
      let message;
      if (client.ai.isAvailable() && settings.welcomeMessage === 'AI') {
        message = await client.ai.generateWelcomeMessage(member.user.username, member.guild.name, lang).catch(() => null);
      }
      message = message || (settings.welcomeMessage || client.i18n.t('welcome.defaultMessage', {}, lang))
        .replace('{user}', `<@${member.id}>`).replace('{guild}', member.guild.name).replace('{count}', count);

      const payload = { content: message };
      if (settings.welcomeCard) {
        const card = await generateCard(member, count);
        if (card) payload.files = [card];
      }
      await channel.send(payload);
    }

    // Auto role
    if (settings.autoRoleId) {
      const role = member.guild.roles.cache.get(settings.autoRoleId);
      if (role && member.guild.members.me.roles.highest.comparePositionTo(role) > 0) {
        const delay = settings.autoRoleDelay || 0;
        const assign = async () => {
          const m = await member.guild.members.fetch(member.id).catch(() => null);
          if (m) await m.roles.add(role, '[Aura] Auto-role').catch(() => {});
        };
        delay > 0 ? setTimeout(assign, delay * 1000) : assign();
      }
    }
  } catch (err) { logger.warn('[Welcome] join:', err.message); }
}

export async function handleMemberLeave(client, member) {
  try {
    const { GuildSettings } = client.db.models;
    const settings = await GuildSettings.findOne({ where: { guildId: member.guild.id } });
    if (!settings?.farewellEnabled || !settings?.farewellChannelId) return;
    const lang    = settings.language || 'en';
    const channel = await client.channels.fetch(settings.farewellChannelId).catch(() => null);
    if (!channel?.isTextBased()) return;
    const msg = (settings.farewellMessage || client.i18n.t('welcome.farewell', {}, lang))
      .replace('{user}', member.user.tag).replace('{guild}', member.guild.name);
    await channel.send({ content: msg });
  } catch {}
}

async function generateCard(member, memberCount) {
  try {
    const canvas = createCanvas(1100, 400);
    const ctx    = canvas.getContext('2d');

    // Background
    const bg = ctx.createLinearGradient(0, 0, 1100, 400);
    bg.addColorStop(0, '#0d1117'); bg.addColorStop(1, '#161b22');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, 1100, 400);

    // Border
    ctx.strokeStyle = '#5865F2'; ctx.lineWidth = 3;
    ctx.strokeRect(12, 12, 1076, 376);

    // Avatar
    const avatarUrl = member.user.displayAvatarURL({ size: 256, extension: 'png' });
    const avatar    = await loadImage(avatarUrl).catch(() => null);
    const cx = 200, cy = 200, r = 100;
    if (avatar) {
      const ring = ctx.createRadialGradient(cx, cy, r-5, cx, cy, r+12);
      ring.addColorStop(0, '#5865F2'); ring.addColorStop(1, 'rgba(88,101,242,0)');
      ctx.beginPath(); ctx.arc(cx, cy, r+12, 0, Math.PI*2); ctx.fillStyle = ring; ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, r+5, 0, Math.PI*2); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.clip();
      ctx.drawImage(avatar, cx-r, cy-r, r*2, r*2); ctx.restore();
    }

    // Text
    ctx.font = 'bold 34px sans-serif'; ctx.fillStyle = '#5865F2';
    ctx.fillText('WELCOME', 360, 128);
    const name = member.user.username.length > 22 ? member.user.username.slice(0,22)+'…' : member.user.username;
    ctx.font = 'bold 52px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(name, 360, 205);
    ctx.font = '28px sans-serif'; ctx.fillStyle = '#8b949e'; ctx.fillText(`@${member.user.username}`, 362, 252);
    ctx.font = '24px sans-serif'; ctx.fillText(`Member #${memberCount.toLocaleString()}`, 362, 310);
    const gname = member.guild.name.length > 32 ? member.guild.name.slice(0,32)+'…' : member.guild.name;
    ctx.font = '20px sans-serif'; ctx.fillText(`in ${gname}`, 362, 345);

    // Bottom line
    const line = ctx.createLinearGradient(50, 380, 1050, 380);
    line.addColorStop(0, 'rgba(88,101,242,0)'); line.addColorStop(0.5, '#5865F2'); line.addColorStop(1, 'rgba(88,101,242,0)');
    ctx.fillStyle = line; ctx.fillRect(50, 375, 1000, 3);

    return new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'welcome.png' });
  } catch (err) { logger.warn('[Welcome] card:', err.message); return null; }
}

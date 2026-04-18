// ================================================================
//  AURA BOT v2.0 — Neural Card Generator (Canvas Engine)
// ================================================================
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { AttachmentBuilder } from 'discord.js';

/**
 * Generates a premium Aura Profile Card
 */
export async function generateAuraCard(user, data) {
  const canvas = createCanvas(800, 300);
  const ctx    = canvas.getContext('2d');

  // ── 1. Background & Styling ────────────────────────────────────
  const grad = ctx.createLinearGradient(0, 0, 800, 300);
  grad.addColorStop(0, '#0F0C29');
  grad.addColorStop(0.5, '#302B63');
  grad.addColorStop(1, '#24243E');
  
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 800, 300);

  // Subtle Aura Pattern
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 800; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 300);
    ctx.stroke();
  }

  // ── 2. Avatar ──────────────────────────────────────────────────
  ctx.save();
  ctx.beginPath();
  ctx.arc(100, 150, 70, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();

  const avatar = await loadImage(user.displayAvatarURL({ extension: 'png', size: 256 }));
  ctx.drawImage(avatar, 30, 80, 140, 140);
  ctx.restore();

  // Avatar Border
  ctx.strokeStyle = '#BF5AF2';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(100, 150, 72, 0, Math.PI * 2, true);
  ctx.stroke();

  // ── 3. Text & Info ─────────────────────────────────────────────
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText(user.username.toUpperCase(), 200, 100);

  ctx.fillStyle = '#A0A0A0';
  ctx.font = '16px sans-serif';
  ctx.fillText('NEURAL IDENTITY VERIFIED', 200, 125);

  // Stats Grid
  const stats = [
    { label: 'AURA POINTS', value: data.balance.toLocaleString(), x: 200 },
    { label: 'DAILY STREAK', value: `${data.streak} DAYS`, x: 400 },
    { label: 'REPUTATION', value: data.reputation.toLocaleString(), x: 600 },
  ];

  stats.forEach(s => {
    ctx.fillStyle = '#BF5AF2';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(s.label, s.x, 180);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(s.value, s.x, 215);
  });

  // Footer Branding
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.font = 'italic 12px sans-serif';
  ctx.fillText('AURA INTELLIGENCE v2.1 // POWERED BY GEMINI', 200, 270);

  return new AttachmentBuilder(await canvas.encode('png'), { name: 'aura-profile.png' });
}

// ================================================================
//  Embed Builder Utility
// ================================================================
import { EmbedBuilder } from 'discord.js';
import config           from '../../config/config.js';

export function buildEmbed({
  type = 'primary', title, description, fields = [], footer,
  thumbnail, image, timestamp = false, author, authorIcon, url, color,
} = {}) {
  const colors = {
    success: config.colors.success, error: config.colors.error,
    warning: config.colors.warning, info:  config.colors.info,
    primary: config.colors.primary, security: config.colors.security,
    premium: config.colors.premium, neutral: config.colors.neutral,
    ai:      config.colors.ai,      economy: config.colors.economy,
    fun:     config.colors.fun,
  };

  const embed = new EmbedBuilder().setColor(color ?? colors[type] ?? config.colors.primary);
  if (title)       embed.setTitle(title);
  if (description) embed.setDescription(description);
  if (thumbnail)   embed.setThumbnail(thumbnail);
  if (image)       embed.setImage(image);
  if (url)         embed.setURL(url);
  if (timestamp)   embed.setTimestamp();
  if (author)      embed.setAuthor({ name: author, iconURL: authorIcon });
  if (footer !== undefined) embed.setFooter({ text: footer ?? `Aura v${config.version}` });
  if (fields.length) embed.addFields(fields.map(f => ({ name: f.name, value: f.value, inline: f.inline ?? false })));
  return embed;
}

export function buildModEmbed({ action, user, moderator, reason, duration, caseId, extra = [] }) {
  const colors = { ban: config.colors.error, kick: config.colors.warning, timeout: config.colors.warning, warn: config.colors.warning, softban: config.colors.error, unban: config.colors.success };
  const emojis = { ban: '🔨', kick: '👢', timeout: '🔇', timeout_remove: '🔓', warn: '📝', softban: '🔨', unban: '🔓', note: '📋' };

  const embed = new EmbedBuilder()
    .setColor(colors[action] ?? config.colors.primary)
    .setTitle(`${emojis[action] || '📋'} ${action.charAt(0).toUpperCase() + action.slice(1).replace('_', ' ')}`)
    .addFields(
      { name: '👤 User',      value: `${user.tag ?? user} (${user.id ?? user})`, inline: true },
      { name: '🔨 Moderator', value: `${moderator.tag ?? moderator}`,            inline: true },
      { name: '📝 Reason',    value: reason || 'No reason',                      inline: false },
    ).setTimestamp();

  if (caseId)   embed.setFooter({ text: `Case #${caseId}` });
  if (duration) embed.addFields({ name: '⏱️ Duration', value: duration, inline: true });
  extra.forEach(f => embed.addFields(f));
  return embed;
}

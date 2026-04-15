// ================================================================
//  Embed Builder Utility
// ================================================================
import { EmbedBuilder } from 'discord.js';
import config           from '../../config/config.js';

export function buildEmbed({
  type = 'primary', title, description, fields = [], footer,
  thumbnail, image, timestamp = false, author, authorIcon, url, color, addPadding = true
} = {}) {
  const colors = {
    success: config.colors.success || '#00FF7F', 
    error: config.colors.error || '#FF4C4C',
    warning: config.colors.warning || '#FFD700', 
    info:  config.colors.info || '#00BFFF',
    primary: config.colors.primary || '#5865F2', 
    security: config.colors.security || '#2F3136',
    premium: config.colors.premium || '#FF73FA', 
    neutral: config.colors.neutral || '#95A5A6',
    ai:      config.colors.ai || '#00FFEA',      
    economy: config.colors.economy || '#F1C40F',
    fun:     config.colors.fun || '#FF9999',
  };

  const embed = new EmbedBuilder().setColor(color ?? colors[type] ?? config.colors.primary);
  
  if (title)       embed.setTitle(title);
  if (description) embed.setDescription(description);
  
  if (thumbnail)   embed.setThumbnail(thumbnail);
  if (image)       embed.setImage(image);
  if (url)         embed.setURL(url);
  if (timestamp)   embed.setTimestamp();
  
  if (author)      embed.setAuthor({ name: author, iconURL: authorIcon });
  else             embed.setAuthor({ name: '✨ Aura Bot v2.0', iconURL: 'https://cdn.discordapp.com/emojis/1109405021876542289.webp' }); // Example default

  if (footer !== undefined) {
    embed.setFooter({ text: footer ?? `Aura Core System v${config.version}` });
  } else {
    embed.setFooter({ text: `Aura Enterprise AI • v${config.version}` });
  }

  if (fields.length) {
    const formattedFields = fields.map(f => ({
      name: f.name,
      value: addPadding ? `${f.value}\n\u200B` : f.value, // Adds blank padding underneath
      inline: f.inline ?? false 
    }));
    embed.addFields(formattedFields);
  }
  
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

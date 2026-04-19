// ================================================================
//  AURA BOT v2.0 — Staff Performance System (ASP)
// ================================================================
import { buildEmbed } from '../../utils/embedBuilder.js';
import logger from '../../utils/logger.js';

/**
 * Toggles duty status for a staff member
 */
export async function toggleDuty(client, guildId, userId) {
  const { StaffDuty } = client.db.models;
  const [duty] = await StaffDuty.findOrCreate({ where: { guildId, userId } });

  if (!duty.isOnDuty) {
    // START DUTY
    await duty.update({
      isOnDuty: true,
      lastDutyStart: new Date(),
      // Reset current shift counters
      messagesSent: 0,
      voiceTime: 0,
      ticketsHandled: 0
    });
    return { status: 'on', data: duty };
  } else {
    // END DUTY
    const shiftSeconds = Math.floor((Date.now() - new Date(duty.lastDutyStart).getTime()) / 1000);
    const updatedTotalTime = (duty.totalDutyTime || 0) + shiftSeconds;

    const report = {
      duration: shiftSeconds,
      messages: duty.messagesSent,
      voice: duty.voiceTime,
      tickets: duty.ticketsHandled
    };

    await duty.update({
      isOnDuty: false,
      totalDutyTime: updatedTotalTime,
      lastDutyStart: null
    });

    return { status: 'off', report, data: duty };
  }
}

/**
 * Global tracker for activity
 */
export async function trackActivity(client, guildId, userId, type, value = 1) {
  const { StaffDuty } = client.db.models;
  const duty = await StaffDuty.findOne({ where: { guildId, userId, isOnDuty: true } });
  if (!duty) return;

  if (type === 'message') await duty.increment('messagesSent', { by: value });
  if (type === 'voice')   await duty.increment('voiceTime', { by: value });
  if (type === 'ticket')  await duty.increment('ticketsHandled', { by: value });
}

/**
 * Send shift report to log channel
 */
export async function sendStaffReport(client, guild, user, report) {
  const { GuildSettings } = client.db.models;
  const settings = await GuildSettings.findOne({ where: { guildId: guild.id } });
  
  // Specific staff log channel prioritized, then fallback to moderation log
  const logChannelId = settings?.staffLogChannelId || settings?.modLogChannelId; 
  if (!logChannelId) return;

  const channel = guild.channels.cache.get(logChannelId) || await client.channels.fetch(logChannelId).catch(() => null);
  if (!channel?.isTextBased()) return;

  const hours   = Math.floor(report.duration / 3600);
  const minutes = Math.floor((report.duration % 3600) / 60);

  const embed = buildEmbed({
    type: 'info',
    title: `📋 Staff Shift Report — ${user.tag}`,
    thumbnail: user.displayAvatarURL(),
    description: `Staff member has punched out from their shift.`,
    fields: [
      { name: '⏱️ Duration', value: `${hours}h ${minutes}m`, inline: true },
      { name: '💬 Messages', value: `${report.messages}`, inline: true },
      { name: '🎫 Tickets', value: `${report.tickets}`, inline: true },
      { name: '🔊 Voice Time', value: `${Math.floor(report.voice / 60)}m`, inline: true },
    ],
    timestamp: true
  });

  await channel.send({ embeds: [embed] });
}

// ================================================================
//  AURA BOT v2.0 — Staff Management Commands
// ================================================================
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import * as staff from '../../../shared/systems/staff/staffSystem.js';
import { buildEmbed } from '../../../shared/utils/embedBuilder.js';

export const staffCommand = {
  data: new SlashCommandBuilder()
    .setName('staff')
    .setDescription('Staff management and performance tracking')
    .addSubcommand(s => s
      .setName('duty')
      .setDescription('Toggle your shift (Check-in/Check-out)')
    )
    .addSubcommand(s => s
      .setName('stats')
      .setDescription('View your staff performance statistics')
      .addUserOption(o => o.setName('target').setDescription('Staff member to view stats for'))
    ),

  guildOnly: true,
  cooldown: 5000,

  async execute(client, interaction) {
    try {
      // Only allow members with a certain role or ManageMessages permission
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return interaction.reply({
          embeds: [buildEmbed({ type: 'error', description: '❌ Access Denied: Staff only.' })],
          ephemeral: true,
        });
      }

      const sub = interaction.options.getSubcommand();

      if (sub === 'duty') {
        const result = await staff.toggleDuty(client, interaction.guildId, interaction.user.id);
        
        if (result.status === 'on') {
          return interaction.reply({
            embeds: [buildEmbed({
              type: 'success',
              title: '✅ Shift Started',
              description: `You are now **On Duty**. Your messages, voice time, and ticket responses are being tracked.`,
              footer: 'Good luck with your shift!',
              timestamp: true,
            })],
          });
        }

        const report = result.report || { duration: 0, messages: 0, tickets: 0, voice: 0 };
        await staff.sendStaffReport(client, interaction.guild, interaction.user, report);
        
        const hours   = Math.floor(report.duration / 3600);
        const minutes = Math.floor((report.duration % 3600) / 60);

        return interaction.reply({
          embeds: [buildEmbed({
            type: 'warning',
            title: '🏁 Shift Ended',
            description: `You have completed your shift. A report has been sent to the logs.\n\n**Duration:** ${hours}h ${minutes}m\n**Messages:** ${report.messages}\n**Tickets:** ${report.tickets}`,
            timestamp: true,
          })],
        });
      }

      if (sub === 'stats') {
        const target = interaction.options.getUser('target') || interaction.user;
        const { StaffDuty } = client.db.models;
        const duty = await StaffDuty.findOne({ where: { guildId: interaction.guildId, userId: target.id } });

        if (!duty) {
          return interaction.reply({
            embeds: [buildEmbed({ type: 'warning', description: '❌ No staff data found for this user.' })],
            ephemeral: true,
          });
        }

        const liveShiftSeconds = duty.isOnDuty && duty.lastDutyStart
          ? Math.max(0, Math.floor((Date.now() - new Date(duty.lastDutyStart).getTime()) / 1000))
          : 0;
        const totalSeconds = (duty.totalDutyTime || 0) + liveShiftSeconds;
        const totHours = Math.floor(totalSeconds / 3600);
        const totMins  = Math.floor((totalSeconds % 3600) / 60);

        return interaction.reply({
          embeds: [buildEmbed({
            type: 'info',
            title: `📊 Staff Statistics — ${target.tag}`,
            thumbnail: target.displayAvatarURL(),
            fields: [
              { name: 'Status', value: duty.isOnDuty ? '🟢 On Duty' : '🔴 Off Duty', inline: true },
              { name: 'Total Work Time', value: `${totHours}h ${totMins}m`, inline: true },
              { name: 'Total Msg Sent', value: `${duty.messagesSent}`, inline: true },
              { name: 'Tickets Handled', value: `${duty.ticketsHandled}`, inline: true },
            ],
            timestamp: true,
          })],
        });
      }
    } catch (err) {
      client.logger.error('[Staff] command failed:', err);
      return interaction.reply({
        embeds: [buildEmbed({ type: 'error', description: '❌ Failed to process this staff command.' })],
        ephemeral: true,
      }).catch(() => {});
    }
  },
};

export default staffCommand;

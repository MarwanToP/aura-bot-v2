// ================================================================
//  /modstaff — Staff Performance Analytics & Shift Tracker
//
//  Every number this command prints is read from the tables that
//  actually track it (staff_duty / staff_fingerprints /
//  moderation_cases / warnings / tickets). A metric whose table is
//  missing or unreadable is reported as "not tracked" — never as a
//  plausible-looking fake number.
// ================================================================
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { buildEmbed } from '../../../shared/utils/embedBuilder.js';
import { toggleDuty } from '../../../shared/systems/staff/staffSystem.js';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const NOT_TRACKED = 'not tracked';

/**
 * Count the rows of a model for a filter.
 * `tracked: false` means the metric cannot be read at all (table missing or
 * the query failed) — that is reported as "not tracked" instead of "0".
 */
async function countWhere(model, where) {
  if (!model || typeof model.count !== 'function') return { tracked: false, value: 0 };
  try {
    const raw = await model.count({ where });
    const value = Number(raw);
    return { tracked: true, value: Number.isFinite(value) ? value : 0 };
  } catch {
    return { tracked: false, value: 0 };
  }
}

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

const formatCount = (result) => (result.tracked ? String(result.value) : NOT_TRACKED);

/**
 * /modstaff shift — punch in / punch out.
 * The shared duty system owns the tracking (staff_duty state + total time and
 * the staff_fingerprints log the stats read back), so this command and
 * /staff duty share one source of truth.
 */
async function handleShift(client, interaction) {
  const action  = interaction.options.getString('action');
  const guildId = interaction.guildId;
  const userId  = interaction.user.id;

  await interaction.deferReply().catch(() => {});

  try {
    const { StaffDuty } = client.db?.models || {};
    const duty  = await StaffDuty.findOne({ where: { guildId, userId } });
    const onDuty = Boolean(duty?.isOnDuty);

    if (action === 'start' && onDuty) {
      return interaction.editReply({
        embeds: [buildEmbed({ type: 'warning', description: '🟡 You are already **on duty** — end your shift first.' })],
      });
    }

    if (action === 'end' && !onDuty) {
      return interaction.editReply({
        embeds: [buildEmbed({ type: 'warning', description: '🔴 You are not **on duty** right now, so there is no shift to end.' })],
      });
    }

    const result = await toggleDuty(client, guildId, userId);

    if (result?.status === 'on') {
      return interaction.editReply({
        embeds: [buildEmbed({ type: 'success', description: '🟢 Your moderation shift has **started**. Aura is now tracking your activity.' })],
      });
    }

    const report = result?.report || { duration: 0, messages: 0, tickets: 0, voice: 0 };
    return interaction.editReply({
      embeds: [buildEmbed({
        type: 'error',
        description: `🔴 Your moderation shift has **ended**.\n\n**Duration:** ${formatDuration(report.duration)}\n**Messages:** ${Number(report.messages) || 0}\n**Tickets:** ${Number(report.tickets) || 0}\n**Voice:** ${formatDuration(report.voice)}`,
      })],
    });
  } catch (err) {
    client.logger?.warn?.('[ModStaff] shift update failed:', err?.message);
    return interaction.editReply({
      embeds: [buildEmbed({ type: 'error', description: '❌ Failed to update your moderation shift.' })],
    });
  }
}

/**
 * /modstaff stats — live analytics for the calling staff member.
 *
 * Sources (all scoped to this guild AND this moderator):
 *   • Time on shift  → staff_fingerprints (completed shifts) + staff_duty (running shift)
 *   • Tickets        → tickets.closed_by
 *   • Warnings       → warnings.moderator_id
 *   • Mutes / Bans   → moderation_cases.moderator_id
 */
async function handleStats(client, interaction) {
  const guildId = interaction.guildId;
  const userId  = interaction.user.id;

  await interaction.deferReply().catch(() => {});

  const { StaffDuty, StaffFingerprint, ModerationCase, Warning, Ticket } = client.db?.models || {};

  // The date filter uses the Op symbol exported on the Sequelize instance
  // (the same pattern the background tasks use) — no extra dependency needed.
  const op          = client.db?.Op;
  const weekAgo     = new Date(Date.now() - WEEK_MS);
  const weekFilter  = op?.gte ? { [op.gte]: weekAgo } : null;
  const windowLabel = weekFilter ? 'this Week' : 'All Time';
  const inWindow    = (extra, column = 'createdAt') => (weekFilter ? { ...extra, [column]: weekFilter } : extra);

  // ── Time on shift ─────────────────────────────────────────────
  let dutyText = NOT_TRACKED;
  try {
    if (StaffDuty?.findOne && StaffFingerprint?.findAll) {
      const [fingerprints, duty] = await Promise.all([
        // The newest rows first — the window filter below only needs the
        // recent ones, and the list must stay bounded.
        StaffFingerprint.findAll({ where: { guildId, userId }, order: [['timestamp', 'DESC']], limit: 500 }),
        StaffDuty.findOne({ where: { guildId, userId } }),
      ]);

      const completedSeconds = (Array.isArray(fingerprints) ? fingerprints : [])
        .filter((f) => f?.type === 'off' && f?.duration != null && f?.timestamp
          && new Date(f.timestamp).getTime() >= weekAgo.getTime())
        .reduce((sum, f) => sum + (Number(f.duration) || 0), 0);

      const liveSeconds = duty?.isOnDuty && duty?.lastDutyStart
        ? Math.max(0, Math.floor((Date.now() - new Date(duty.lastDutyStart).getTime()) / 1000))
        : 0;

      dutyText = formatDuration(completedSeconds + liveSeconds);
    }
  } catch {
    dutyText = NOT_TRACKED;
  }

  // ── Everything else comes straight from the moderation tables ─
  const [warnings, mutes, bans, tickets] = await Promise.all([
    countWhere(Warning,       inWindow({ guildId, moderatorId: userId })),
    countWhere(ModerationCase, inWindow({ guildId, moderatorId: userId, type: 'timeout' })),
    countWhere(ModerationCase, inWindow({ guildId, moderatorId: userId, type: 'ban' })),
    countWhere(Ticket,        inWindow({ guildId, closedBy: userId }, 'closedAt')),
  ]);

  const embed = buildEmbed({
    type: 'premium',
    title: '📈 Staff Analytics Report',
    description: [
      `**${interaction.user.username}'s Stats ${windowLabel}:**`,
      '',
      `• Time on Shift: ${dutyText}`,
      `• Tickets Resolved: ${formatCount(tickets)}`,
      `• Warnings Issued: ${formatCount(warnings)}`,
      `• Mutes: ${formatCount(mutes)}`,
      `• Bans: ${formatCount(bans)}`,
    ].join('\n'),
    footer: 'Live data — staff duty log, moderation cases, warnings and tickets',
    timestamp: true,
  });

  return interaction.editReply({ embeds: [embed] });
}

export const staff = {
  data: new SlashCommandBuilder()
    .setName('modstaff')
    .setDescription('Staff Performance Analytics & Shift Tracker')
    .addSubcommand(sub => sub.setName('shift').setDescription('Start or end your moderation shift').addStringOption(opt => opt.setName('action').setDescription('Start or End').setRequired(true).addChoices({ name: 'Start', value: 'start' }, { name: 'End', value: 'end' })))
    .addSubcommand(sub => sub.setName('stats').setDescription('View staff moderation analytics'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  guildOnly: true,

  async execute(client, interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'shift') {
      return handleShift(client, interaction);
    }
    return handleStats(client, interaction);
  },
};

export default staff;

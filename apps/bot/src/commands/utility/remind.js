// ================================================================
//  AURA BOT v2.0 — Reminders
//  /remind set|list|cancel — personal reminders delivered by the
//  backgroundTasks cron job (original channel first, DM fallback).
// ================================================================
import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import ms from 'ms';
import { buildEmbed } from '../../../../../packages/utils/embedBuilder.js';

const MIN_DURATION_MS = 60 * 1000;                 // 1 minute
const MAX_DURATION_MS = 365 * 24 * 60 * 60 * 1000; // 365 days
const MAX_PENDING     = 25;                        // per user, per guild

// Discord relative timestamp (<t:...:R>); degrades gracefully for missing rows (test mocks).
function relativeTime(date) {
  const secs = Math.floor(new Date(date).getTime() / 1000);
  return Number.isFinite(secs) ? `<t:${secs}:R>` : '—';
}

export const remind = {
  data: new SlashCommandBuilder()
    .setName('remind')
    .setDescription('Manage your personal reminders')
    .addSubcommand(s => s
      .setName('set')
      .setDescription('Schedule a new reminder')
      .addStringOption(o => o.setName('duration').setDescription('When to remind you (e.g. 10m, 2h, 3d — between 1 minute and 365 days)').setRequired(true))
      .addStringOption(o => o.setName('content').setDescription('What should the reminder say? (max 500 characters)').setRequired(true).setMaxLength(500))
    )
    .addSubcommand(s => s
      .setName('list')
      .setDescription('List your next 10 pending reminders in this server')
    )
    .addSubcommand(s => s
      .setName('cancel')
      .setDescription('Cancel one of your pending reminders')
      .addIntegerOption(o => o.setName('id').setDescription('Reminder ID (see /remind list)').setRequired(true).setMinValue(1))
    ),

  cooldown: 5000,
  guildOnly: true,

  async execute(client, interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch(() => {});

    const userId  = interaction.user.id;
    const guildId = interaction.guildId;
    const lang    = await client.i18n.resolveLanguage(client, userId, guildId).catch(() => 'en');
    const t       = (key, vars = {}) => client.i18n.t(`remind.${key}`, vars, lang);

    try {
      const { Reminder } = client.db.models;
      const sub = interaction.options.getSubcommand();

      // ── /remind set ───────────────────────────────────────────
      if (sub === 'set') {
        const raw        = interaction.options.getString('duration');
        const content    = (interaction.options.getString('content') || '').trim();
        const durationMs = ms(raw);

        if (!content || !durationMs || durationMs < MIN_DURATION_MS || durationMs > MAX_DURATION_MS) {
          return interaction.editReply({
            embeds: [buildEmbed({ type: 'error', description: t('errors.invalidDuration') })],
          });
        }

        const pending = await Reminder.count({ where: { userId, guildId, sent: false } });
        if (pending >= MAX_PENDING) {
          return interaction.editReply({
            embeds: [buildEmbed({ type: 'error', description: t('errors.tooMany', { max: MAX_PENDING }) })],
          });
        }

        const remindAt = new Date(Date.now() + durationMs);
        const row = await Reminder.create({
          userId, guildId, channelId: interaction.channelId, content, remindAt, sent: false,
        });

        return interaction.editReply({
          embeds: [buildEmbed({
            type: 'success',
            title: '⏰ Reminder Set',
            description: t('set.success', { time: relativeTime(remindAt), content }),
            footer: `ID #${row.id}`,
            timestamp: true,
          })],
        });
      }

      // ── /remind list ──────────────────────────────────────────
      if (sub === 'list') {
        const rows = await Reminder.findAll({
          where: { userId, guildId, sent: false },
          order: [['id', 'DESC']],
          limit: 10,
        });

        if (!rows.length) {
          return interaction.editReply({
            embeds: [buildEmbed({ type: 'info', description: t('list.empty') })],
          });
        }

        const description = rows.map(r => {
          const preview = String(r.content ?? '').replace(/\n/g, ' ').slice(0, 80);
          return `**#${r.id}** • ${relativeTime(r.remindAt)}\n${preview}`;
        }).join('\n\n');

        return interaction.editReply({
          embeds: [buildEmbed({
            type: 'info',
            title: t('list.title'),
            description,
            footer: t('list.footer'),
          })],
        });
      }

      // ── /remind cancel ────────────────────────────────────────
      if (sub === 'cancel') {
        const id  = interaction.options.getInteger('id');
        const row = await Reminder.findOne({ where: { id, userId, guildId, sent: false } });

        if (!row) {
          return interaction.editReply({
            embeds: [buildEmbed({ type: 'error', description: t('cancel.notFound') })],
          });
        }

        await row.destroy();
        return interaction.editReply({
          embeds: [buildEmbed({ type: 'success', description: t('cancel.success', { id }) })],
        });
      }
    } catch (err) {
      // Unexpected failures only — expected problems are handled above with friendly
      // replies (the command test harness counts any logger.error during a path as a
      // failure, so keep this branch for genuine exceptions).
      client.logger?.error?.('[Remind] command failed:', err);
      return interaction.editReply({
        embeds: [buildEmbed({ type: 'error', description: t('errors.generic') })],
      }).catch(() => {});
    }
  },
};

export default remind;

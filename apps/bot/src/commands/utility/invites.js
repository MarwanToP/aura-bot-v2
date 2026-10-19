// ================================================================
//  AURA BOT v2.0 — Invite Tracker Command Suite
// ================================================================
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { buildEmbed } from '../../../shared/utils/embedBuilder.js';

export const invitesCommand = {
  data: new SlashCommandBuilder()
    .setName('invites')
    .setDescription('Advanced Invite Tracker analytics (Invite Tracker style)')
    .addSubcommand(s => s
      .setName('stats')
      .setDescription('View detailed invite breakdown (Joins, Leaves, Fake, Bonus)')
      .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(false))
    )
    .addSubcommand(s => s
      .setName('leaderboard')
      .setDescription('View top inviters in the server')
    )
    .addSubcommand(s => s
      .setName('addbonus')
      .setDescription('Add bonus invites to a user (Admin only)')
      .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(true))
      .addIntegerOption(o => o.setName('amount').setDescription('Bonus invite count').setRequired(true).setMinValue(1).setMaxValue(10000))
    ),

  botPermissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  cooldown: 3000,

  async execute(client, interaction) {
    try {
      await interaction.deferReply().catch(() => {});
      const sub = interaction.options.getSubcommand?.() || 'stats';
      const targetUser = interaction.options.getUser('user') || interaction.user;
      const { InviteTrack } = client.db.models;
      const { fn, col, literal } = client.db;
      const guildId = interaction.guildId;

      if (sub === 'leaderboard') {
        // Real top inviters straight from invite_tracks: COUNT(id) grouped per inviter.
        const rows = await InviteTrack.findAll({
          attributes: [
            'inviterId',
            [fn('COUNT', col('id')), 'total'],
            [fn('COALESCE', fn('SUM', col('bonus')), 0), 'bonus'],
          ],
          where: { guildId },
          group: ['inviterId'],
          order: [[fn('COUNT', col('id')), 'DESC']],
          limit: 10,
          raw: true,
        });
        const lines = rows
          .filter(r => r.inviterId)
          .map((r, i) => {
            const total = Number(r.total) || 0;
            const bonus = Number(r.bonus) || 0;
            return `${i + 1}. <@${r.inviterId}> — **${total}** invite${total === 1 ? '' : 's'}${bonus > 0 ? ` (+${bonus} bonus)` : ''}`;
          });
        return interaction.editReply({
          embeds: [buildEmbed({
            type: 'info',
            title: '🏆 Top Server Inviters',
            description: lines.length ? lines.join('\n') : 'No invites have been tracked in this server yet.',
          })],
        });
      }

      if (sub === 'addbonus') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
          return interaction.editReply({ content: '❌ You need Manage Guild permission to add bonus invites.' });
        }

        // Safety clamp — Discord enforces 1..10000 on the option, but never trust the payload.
        const requested = interaction.options.getInteger('amount') ?? 1;
        const amount = Math.min(10000, Math.max(1, Math.trunc(requested)));

        // Single-anchor convention: bonus is only ever stored on the oldest (MIN(id))
        // InviteTrack row for a (guildId, inviterId) pair. Every join still gets its own
        // row, so COUNT(id) stays exact while SUM(bonus) never double-counts.
        const anchor = await InviteTrack.findOne({
          where: { guildId, inviterId: targetUser.id },
          order: [['id', 'ASC']],
          attributes: ['id'],
        });

        if (!anchor) {
          return interaction.editReply({
            embeds: [buildEmbed({
              type: 'info',
              title: '🎁 Bonus Invites',
              description: `${targetUser} has no tracked invites yet — bonus requires at least one tracked invite.`,
            })],
          });
        }

        // Atomic increment — a single UPDATE ... SET bonus = bonus + amount, never read-modify-write.
        await InviteTrack.increment('bonus', { by: amount, where: { id: anchor.id } });

        // Re-read the summed bonus (summed the same way /invites stats reports it).
        const bonusRow = await InviteTrack.findOne({
          attributes: [[fn('COALESCE', fn('SUM', col('bonus')), 0), 'bonus']],
          where: { guildId, inviterId: targetUser.id },
          raw: true,
        });
        const bonusNow = Number(bonusRow?.bonus) || 0;

        return interaction.editReply({
          embeds: [buildEmbed({
            type: 'success',
            title: '🎁 Bonus Invites Added',
            description: `Added **+${amount}** bonus invites to ${targetUser}. They now have **${bonusNow}** bonus invite(s).`,
          })],
        });
      }

      // Default: stats — one aggregate row over the real invite_tracks data.
      const row = await InviteTrack.findOne({
        attributes: [
          [fn('COUNT', col('id')), 'total'],
          [fn('COALESCE', fn('SUM', col('bonus')), 0), 'bonus'],
          [literal('SUM(CASE WHEN fake THEN 1 ELSE 0 END)'), 'fakeCnt'],
          [literal('SUM(CASE WHEN "left" THEN 1 ELSE 0 END)'), 'leftCnt'],
        ],
        where: { guildId, inviterId: targetUser.id },
        raw: true,
      });
      const total = Number(row?.total) || 0;
      const fake = Number(row?.fakeCnt) || 0;
      const left = Number(row?.leftCnt) || 0;
      const bonus = Number(row?.bonus) || 0;
      const real = total - fake; // Regular = valid joins (everything not flagged fake)

      return interaction.editReply({
        embeds: [buildEmbed({
          type: 'info',
          title: `📩 Invite Statistics for ${targetUser.username}`,
          description: `• **Total Invites:** ${total}\n• **Regular:** ${real}\n• **Left:** ${left}\n• **Fake:** ${fake}\n• **Bonus:** ${bonus}`,
        })],
      });
    } catch (err) {
      client.logger?.error?.('[Invites] command failed:', err);
      return interaction.editReply({
        embeds: [buildEmbed({ type: 'error', description: '❌ Failed to process the invites command.' })],
      }).catch(() => {});
    }
  },
};

export default invitesCommand;

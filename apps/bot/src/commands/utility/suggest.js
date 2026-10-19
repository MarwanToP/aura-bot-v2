// ================================================================
//  AURA BOT v2.0 — Suggestions System
//  Users submit, vote, admins approve/reject
// ================================================================
import { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { buildEmbed } from '../../../shared/utils/embedBuilder.js';
import { Op } from 'sequelize';

const STATUS_COLORS = {
  pending:     0xFFBB33,
  approved:    0x00C851,
  rejected:    0xFF4444,
  implemented: 0x5865F2,
};

const STATUS_LABEL = {
  pending:     '⏳ Pending',
  approved:    '✅ Approved',
  rejected:    '❌ Rejected',
  implemented: '🚀 Implemented',
};

export const suggest = {
  data: new SlashCommandBuilder()
    .setName('suggest')
    .setDescription('Submit, review and manage community suggestions')
    .addSubcommand(s => s
      .setName('submit')
      .setDescription('Submit a new suggestion to the configured channel')
      .addStringOption(o => o.setName('content').setDescription('Your suggestion (10-2000 characters)').setRequired(true).setMinLength(10).setMaxLength(2000))
    )
    .addSubcommandGroup(g => g
      .setName('admin')
      .setDescription('Manage suggestions (Manage Server only)')
      .addSubcommand(s => s
        .setName('setup')
        .setDescription('Set the channel where suggestions are posted')
        .addChannelOption(o => o.setName('channel').setDescription('Suggestions channel').setRequired(true))
      )
      .addSubcommand(s => s
        .setName('approve')
        .setDescription('Approve a suggestion')
        .addIntegerOption(o => o.setName('id').setDescription('Suggestion ID').setRequired(true).setMinValue(1))
        .addStringOption(o => o.setName('note').setDescription('Optional moderator note').setRequired(false).setMaxLength(500))
      )
      .addSubcommand(s => s
        .setName('reject')
        .setDescription('Reject a suggestion')
        .addIntegerOption(o => o.setName('id').setDescription('Suggestion ID').setRequired(true).setMinValue(1))
        .addStringOption(o => o.setName('note').setDescription('Optional moderator note').setRequired(false).setMaxLength(500))
      )
      .addSubcommand(s => s
        .setName('implement')
        .setDescription('Mark a suggestion as implemented')
        .addIntegerOption(o => o.setName('id').setDescription('Suggestion ID').setRequired(true).setMinValue(1))
      )
      .addSubcommand(s => s
        .setName('list')
        .setDescription('List recent suggestions by status')
        .addStringOption(o => o.setName('status').setDescription('Status to filter by').setRequired(true)
          .addChoices(
            { name: '⏳ Pending',     value: 'pending' },
            { name: '✅ Approved',    value: 'approved' },
            { name: '❌ Rejected',    value: 'rejected' },
            { name: '🚀 Implemented', value: 'implemented' },
          ))
      )
      .addSubcommand(s => s
        .setName('toggle')
        .setDescription('Enable or disable the suggestions system in this server')
      )
    ),

  guildOnly: true,
  cooldown: 5000,

  async execute(client, interaction) {
    // Two subcommands: 'submit' and 'admin'
    const group = interaction.options.getSubcommandGroup(false);
    const sub   = interaction.options.getSubcommand();

    // Permission gate for admin group
    if (group === 'admin' && !interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        embeds: [buildEmbed({ type: 'error', description: '❌ You need `Manage Server` permission for this.' })],
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply({ flags: group === 'admin' ? MessageFlags.Ephemeral : undefined }).catch(() => {});

    try {
      const { GuildSettings, Suggestion } = client.db.models;
      const guildId = interaction.guildId;

      if (sub === 'submit') {
        const content = interaction.options.getString('content').trim();
        const settings = await GuildSettings.findOne({ where: { guildId } });
        if (!settings?.suggestionsEnabled || !settings?.suggestionsChannelId) {
          return interaction.editReply({
            embeds: [buildEmbed({ type: 'warning', description: '⚠️ Suggestions are not enabled in this server. Ask an admin to run `/suggest admin setup`.' })],
          });
        }
        const channel = interaction.guild.channels.cache.get(settings.suggestionsChannelId);
        if (!channel?.isTextBased()) {
          return interaction.editReply({
            embeds: [buildEmbed({ type: 'error', description: '❌ The suggestions channel is missing or not text-based.' })],
          });
        }

        const row = await Suggestion.create({ guildId, userId: interaction.user.id, content });

        const embed = buildEmbed({
          type: 'primary',
          title: '💡 New Suggestion',
          description: content,
          fields: [
            { name: '👤 Author',  value: `<@${interaction.user.id}>`, inline: true },
            { name: '🆔 ID',      value: `\`#${row.id}\``,            inline: true },
            { name: '📊 Status',  value: STATUS_LABEL.pending,        inline: true },
          ],
          footer: 'Upvote / Downvote with the buttons below',
          timestamp: true,
        });
        const components = [new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`suggest:upvote:${row.id}`).setLabel('Upvote').setStyle(ButtonStyle.Success).setEmoji('👍'),
          new ButtonBuilder().setCustomId(`suggest:downvote:${row.id}`).setLabel('Downvote').setStyle(ButtonStyle.Danger).setEmoji('👎'),
        )];

        const msg = await channel.send({ embeds: [embed], components });
        await row.update({ messageId: msg.id });

        return interaction.editReply({
          embeds: [buildEmbed({ type: 'success', description: `✅ Suggestion posted in <#${channel.id}> (ID: \`#${row.id}\`).` })],
        });
      }

      // ── Admin subcommands ──────────────────────────────────
      if (sub === 'setup') {
        const channel = interaction.options.getChannel('channel');
        await GuildSettings.update({
          suggestionsEnabled:   true,
          suggestionsChannelId: channel.id,
        }, { where: { guildId } });
        return interaction.editReply({
          embeds: [buildEmbed({
            type: 'success',
            title: '✅ Suggestions Configured',
            description: `New suggestions will be posted in <#${channel.id}>.`,
          })],
        });
      }

      if (sub === 'toggle') {
        const settings = await GuildSettings.findOne({ where: { guildId } });
        const next = !(settings?.suggestionsEnabled ?? false);
        await GuildSettings.update({ suggestionsEnabled: next }, { where: { guildId } });
        return interaction.editReply({
          embeds: [buildEmbed({ type: 'info', description: `📶 Suggestions system is now **${next ? 'ENABLED' : 'DISABLED'}**.` })],
        });
      }

      if (sub === 'approve' || sub === 'reject' || sub === 'implement') {
        const id   = interaction.options.getInteger('id');
        const note = interaction.options.getString('note') || null;
        const row  = await Suggestion.findOne({ where: { id, guildId } });
        if (!row) {
          return interaction.editReply({
            embeds: [buildEmbed({ type: 'error', description: `❌ No suggestion with ID \`#${id}\` in this server.` })],
          });
        }
        const status = sub === 'approve' ? 'approved' : sub === 'reject' ? 'rejected' : 'implemented';
        await row.update({ status, moderatorId: interaction.user.id, moderatorNote: note });

        // Edit the original message in the suggestions channel, if any
        try {
          const settings = await GuildSettings.findOne({ where: { guildId } });
          if (settings?.suggestionsChannelId && row.messageId) {
            const channel = interaction.guild.channels.cache.get(settings.suggestionsChannelId);
            if (channel?.isTextBased()) {
              const origMsg = await channel.messages.fetch(row.messageId).catch(() => null);
              if (origMsg) {
                const updated = buildEmbed({
                  type: 'primary',
                  title: '💡 Suggestion',
                  description: row.content,
                  color: STATUS_COLORS[status],
                  fields: [
                    { name: '👤 Author',  value: `<@${row.userId}>`, inline: true },
                    { name: '🆔 ID',      value: `\`#${row.id}\``,     inline: true },
                    { name: '📊 Status',  value: STATUS_LABEL[status], inline: true },
                    ...(note ? [{ name: '📝 Mod Note', value: note, inline: false }] : []),
                    { name: '👍 Upvotes', value: `${row.upvotes}`, inline: true },
                    { name: '👎 Downvotes', value: `${row.downvotes}`, inline: true },
                  ],
                  footer: `${STATUS_LABEL[status]} • by <@${interaction.user.id}>`,
                  timestamp: true,
                });
                await origMsg.edit({ embeds: [updated] }).catch(() => {});
              }
            }
          }
        } catch {}

        return interaction.editReply({
          embeds: [buildEmbed({ type: 'success', description: `✅ Suggestion \`#${id}\` marked as **${STATUS_LABEL[status]}**.` })],
        });
      }

      if (sub === 'list') {
        const status   = interaction.options.getString('status');
        const rows = await Suggestion.findAll({
          where:   { guildId, status },
          order:   [['id', 'DESC']],
          limit:   10,
        });
        if (rows.length === 0) {
          return interaction.editReply({
            embeds: [buildEmbed({ type: 'info', description: `📭 No ${status} suggestions found.` })],
          });
        }
        const lines = rows.map(r => {
          const preview = String(r.content).replace(/\n/g, ' ').slice(0, 60);
          return `**#${r.id}** ${STATUS_LABEL[r.status]} — ${preview}…  (👍 ${r.upvotes} / 👎 ${r.downvotes})`;
        });
        return interaction.editReply({
          embeds: [buildEmbed({
            type: 'info',
            title: `📋 ${rows.length} ${status} suggestion(s)`,
            description: lines.join('\n'),
          })],
        });
      }
    } catch (err) {
      client.logger?.error?.('[Suggest] command failed:', err);
      return interaction.editReply({
        embeds: [buildEmbed({ type: 'error', description: '❌ Failed to process the suggestion command.' })],
      }).catch(() => {});
    }
  },
};

export default suggest;

/**
 * Handle upvote/downvote clicks on suggestion messages.
 * Registered via the component router (events/interactionCreate `getHandler` map).
 */
export async function handleButton(client, interaction, data) {
  const parts = String(data || '').split(':');
  const action = parts[0];
  const id = parseInt(parts[1], 10);
  if (!['upvote', 'downvote'].includes(action) || !Number.isInteger(id)) return;

  await interaction.deferUpdate().catch(() => {});

  const { Suggestion, GuildSettings } = client.db?.models || {};
  const row = await Suggestion?.findOne?.({ where: { id } }).catch(() => null);
  if (!row) return;

  const uid = interaction.user.id;
  const redis = client.redis;
  let duplicate = false;
  try {
    if (redis?.status === 'ready') {
      const res = await redis.set(`suggest:vote:${action}:${id}:${uid}`, '1', 'NX', 'EX', 604800);
      // ioredis returns null when NX is not set; treat anything unexpected as allowed
      if (res === null) duplicate = true;
    }
  } catch {}

  if (duplicate) {
    await interaction.followUp({ content: '❌ You already voted on this suggestion.', flags: MessageFlags.Ephemeral }).catch(() => {});
    return;
  }

  const field = action === 'upvote' ? 'upvotes' : 'downvotes';
  try {
    await row.update({ [field]: (row[field] ?? 0) + 1 });
  } catch {}

  // Refresh button labels with the new counts (best-effort; counts already persisted).
  const refreshed = await Suggestion?.findOne?.({ where: { id } }).catch(() => null) || row;
  const up = refreshed?.upvotes ?? row.upvotes;
  const down = refreshed?.downvotes ?? row.downvotes;

  const components = [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`suggest:upvote:${id}`).setLabel(`👍 ${up}`).setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`suggest:downvote:${id}`).setLabel(`👎 ${down}`).setStyle(ButtonStyle.Danger),
  )];

  await interaction.update({ components }).catch(() => {});

  // Best-effort: edit original suggestion message to display the new counts where a channel is stored.
  try {
    const settings = await GuildSettings?.findOne?.({ where: { guildId: row.guildId } }).catch(() => null);
    const channel = settings?.suggestionsChannelId
      ? interaction.guild?.channels?.cache?.get(settings.suggestionsChannelId)
      : null;
    const msg = channel?.isTextBased?.() && row.messageId ? await channel.messages.fetch(row.messageId).catch(() => null) : null;
    if (msg) {
      const updatedEmbed = buildEmbed({
        type: 'primary',
        title: '💡 Suggestion',
        description: row.content,
        color: 0xFFBB33,
        fields: [
          { name: '👤 Author', value: `<@${row.userId}>`, inline: true },
          { name: '🆔 ID', value: `\`#${row.id}\``, inline: true },
          { name: '📊 Status', value: STATUS_LABEL[row.status] || row.status, inline: true },
          { name: '👍 Upvotes', value: `${up}`, inline: true },
          { name: '👎 Downvotes', value: `${down}`, inline: true },
        ],
        footer: 'Thanks for voting!',
        timestamp: true,
      });
      await msg.edit({ embeds: [updatedEmbed], components }).catch(() => {});
    }
  } catch {}
}

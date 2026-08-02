// ================================================================
//  AURA BOT v2.0 — Suggestion Vote Button Handler
// ================================================================
import { buildEmbed } from '../../shared/utils/embedBuilder.js';

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

export default {
  name: 'interactionCreate',
  async execute(client, interaction) {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith('suggest_')) return;

    const [action, idStr] = interaction.customId.split(':');
    if (!idStr) return;
    const suggestionId = parseInt(idStr, 10);
    if (!Number.isFinite(suggestionId)) return;
    const isUp = action === 'suggest_upvote';

    await interaction.deferReply({ ephemeral: true }).catch(() => {});

    try {
      const { Suggestion } = client.db.models;
      const row = await Suggestion.findByPk(suggestionId);
      if (!row || row.guildId !== interaction.guildId) {
        return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ Suggestion not found.' })] });
      }

      // Rate-limit one vote per user per 5 seconds
      const coolKey = `suggest:cool:${row.id}:${interaction.user.id}`;
      if (await client.redis.get(coolKey)) {
        return interaction.editReply({ embeds: [buildEmbed({ type: 'warning', description: '⏳ Slow down a bit.' })] });
      }
      await client.redis.setex(coolKey, 5, '1');

      // Increment counter
      await row.increment(isUp ? 'upvotes' : 'downvotes');

      // Refresh the original embed to reflect new vote count
      try {
        if (row.messageId) {
          const { GuildSettings } = client.db.models;
          const settings = await GuildSettings.findOne({ where: { guildId: interaction.guildId } });
          if (settings?.suggestionsChannelId) {
            const channel = interaction.guild.channels.cache.get(settings.suggestionsChannelId);
            if (channel?.isTextBased()) {
              const orig = await channel.messages.fetch(row.messageId).catch(() => null);
              if (orig) {
                const refreshed = await Suggestion.findByPk(suggestionId);
                const updated = buildEmbed({
                  type: 'primary',
                  title: '💡 Suggestion',
                  description: refreshed.content,
                  color: STATUS_COLORS[refreshed.status] ?? 0x5865F2,
                  fields: [
                    { name: '👤 Author',   value: `<@${refreshed.userId}>`, inline: true },
                    { name: '🆔 ID',       value: `\`#${refreshed.id}\``,    inline: true },
                    { name: '📊 Status',   value: STATUS_LABEL[refreshed.status], inline: true },
                    ...(refreshed.moderatorNote ? [{ name: '📝 Mod Note', value: refreshed.moderatorNote, inline: false }] : []),
                    { name: '👍 Upvotes',  value: `${refreshed.upvotes}`,   inline: true },
                    { name: '👎 Downvotes', value: `${refreshed.downvotes}`, inline: true },
                  ],
                  footer: 'Upvote / Downvote with the buttons below',
                  timestamp: true,
                });
                await orig.edit({ embeds: [updated] }).catch(() => {});
              }
            }
          }
        }
      } catch {}

      return interaction.editReply({
        embeds: [buildEmbed({
          type: 'success',
          description: `✅ ${isUp ? 'Upvoted' : 'Downvoted'} suggestion \`#${row.id}\`.`,
        })],
      });
    } catch (err) {
      client.logger?.error?.('[Suggest] vote handler failed:', err);
      return interaction.editReply({
        embeds: [buildEmbed({ type: 'error', description: '❌ Vote failed.' })],
      }).catch(() => {});
    }
  },
};

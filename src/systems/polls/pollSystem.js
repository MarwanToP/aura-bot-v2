// ================================================================
//  AURA BOT v2.0 — Polls System (with AI option generation)
// ================================================================

import {
  SlashCommandBuilder, PermissionFlagsBits,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
} from 'discord.js';
import { buildEmbed } from '../../utils/embedBuilder.js';
import logger         from '../../utils/logger.js';

const POLL_EMOJIS = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];

export const poll = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Create an interactive poll')
    .addSubcommand(s => s
      .setName('create')
      .setDescription('Create a poll')
      .addStringOption(o => o.setName('question').setDescription('Poll question').setRequired(true))
      .addStringOption(o => o.setName('option1').setDescription('Option 1').setRequired(true))
      .addStringOption(o => o.setName('option2').setDescription('Option 2').setRequired(true))
      .addStringOption(o => o.setName('option3').setDescription('Option 3'))
      .addStringOption(o => o.setName('option4').setDescription('Option 4'))
      .addStringOption(o => o.setName('option5').setDescription('Option 5'))
      .addStringOption(o => o.setName('duration').setDescription('Poll duration (e.g., 1h, 24h)'))
      .addBooleanOption(o => o.setName('anonymous').setDescription('Hide who voted'))
    )
    .addSubcommand(s => s
      .setName('ai')
      .setDescription('Create a poll with AI-generated options')
      .addStringOption(o => o.setName('topic').setDescription('Poll topic/question').setRequired(true))
      .addIntegerOption(o => o.setName('options').setDescription('Number of options (2-6)').setMinValue(2).setMaxValue(6))
    )
    .addSubcommand(s => s
      .setName('end')
      .setDescription('End a poll')
      .addStringOption(o => o.setName('message_id').setDescription('Poll message ID').setRequired(true))
    )
    .addSubcommand(s => s
      .setName('results')
      .setDescription('View poll results')
      .addStringOption(o => o.setName('message_id').setDescription('Poll message ID').setRequired(true))
    ),

  guildOnly: true,
  cooldown:  5000,

  async execute(client, interaction) {
    await interaction.deferReply();
    const sub = interaction.options.getSubcommand();

    if (sub === 'create' || sub === 'ai') {
      let question, options;

      if (sub === 'create') {
        question = interaction.options.getString('question');
        options  = [1,2,3,4,5]
          .map(i => interaction.options.getString(`option${i}`))
          .filter(Boolean);
      } else {
        // AI-generated options
        const topic  = interaction.options.getString('topic');
        const count  = interaction.options.getInteger('options') || 4;
        question     = topic;

        if (!client.ai.isAvailable()) {
          return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ AI not configured for option generation.' })] });
        }

        const generated = await client.ai.generatePollOptions(topic, count);
        if (!generated?.length) {
          return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ Could not generate poll options.' })] });
        }
        options = generated;
      }

      if (options.length < 2) {
        return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ At least 2 options required.' })] });
      }

      const duration   = interaction.options.getString('duration');
      const anonymous  = interaction.options.getBoolean('anonymous') ?? false;
      const ms_        = await import('ms');
      const endsAt     = duration ? new Date(Date.now() + ms_.default(duration)) : null;

      // Build embed
      const optionLines = options.map((opt, i) => `${POLL_EMOJIS[i]} **${opt}** — 0 votes`);

      const embed = buildEmbed({
        type:        'info',
        title:       `📊 ${question}`,
        description: optionLines.join('\n'),
        footer:      `${anonymous ? '🔒 Anonymous • ' : ''}${endsAt ? `Ends: ${endsAt.toLocaleString()}` : 'No time limit'} • 0 total votes`,
        timestamp:   true,
      });

      // Buttons (max 5 per row, max 2 rows = 10 options)
      const rows = [];
      for (let i = 0; i < Math.min(options.length, 10); i += 5) {
        const row = new ActionRowBuilder();
        options.slice(i, i + 5).forEach((opt, j) => {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`poll:vote:${i + j}`)
              .setLabel(POLL_EMOJIS[i + j] + ' ' + opt.slice(0, 20))
              .setStyle(ButtonStyle.Secondary)
          );
        });
        rows.push(row);
      }

      // End button
      if (interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        const endRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('poll:end').setLabel('End Poll').setStyle(ButtonStyle.Danger).setEmoji('🛑')
        );
        if (rows.length < 5) rows.push(endRow);
      }

      const msg = await interaction.editReply({ embeds: [embed], components: rows, fetchReply: true });

      // Store poll data in Redis
      const pollData = {
        question, options, anonymous, endsAt: endsAt?.toISOString(),
        hostId: interaction.user.id, guildId: interaction.guildId,
        votes: {}, // { userId: optionIndex }
        counts: new Array(options.length).fill(0),
      };
      await client.redis.setJSON(`poll:${msg.id}`, pollData, 86400 * 7); // 7 day TTL

      return;
    }

    if (sub === 'results' || sub === 'end') {
      const msgId   = interaction.options.getString('message_id');
      const pollData = await client.redis.getJSON(`poll:${msgId}`);

      if (!pollData) {
        return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ Poll not found or expired.' })] });
      }

      const totalVotes = pollData.counts.reduce((a, b) => a + b, 0);
      const results    = pollData.options.map((opt, i) => {
        const count   = pollData.counts[i] || 0;
        const pct     = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        const bar     = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5));
        return `${POLL_EMOJIS[i]} **${opt}**\n${bar} ${pct}% (${count} votes)`;
      });

      if (sub === 'end' && interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        await client.redis.del(`poll:${msgId}`);
      }

      return interaction.editReply({
        embeds: [buildEmbed({
          type:        'success',
          title:       `📊 Poll Results — ${pollData.question}`,
          description: results.join('\n\n'),
          footer:      `${totalVotes} total votes`,
          timestamp:   true,
        })],
      });
    }
  },
};

// ─── Button Handler ────────────────────────────────────────────
export async function handleButton(client, interaction, args) {
  const [action, ...rest] = args.split(':');

  if (action === 'vote') {
    const optionIndex = parseInt(rest[0]);
    const msgId       = interaction.message.id;
    const pollData    = await client.redis.getJSON(`poll:${msgId}`);

    if (!pollData) {
      return interaction.reply({ embeds: [buildEmbed({ type: 'error', description: '❌ Poll expired.' })], ephemeral: true });
    }

    if (pollData.endsAt && new Date(pollData.endsAt) < new Date()) {
      return interaction.reply({ embeds: [buildEmbed({ type: 'error', description: '❌ Poll has ended.' })], ephemeral: true });
    }

    const userId   = interaction.user.id;
    const previous = pollData.votes[userId];

    // Remove previous vote
    if (previous !== undefined) {
      pollData.counts[previous] = Math.max(0, (pollData.counts[previous] || 0) - 1);
    }

    // Add new vote
    pollData.votes[userId]       = optionIndex;
    pollData.counts[optionIndex] = (pollData.counts[optionIndex] || 0) + 1;

    await client.redis.setJSON(`poll:${msgId}`, pollData, 86400 * 7);

    // Update embed
    const totalVotes = pollData.counts.reduce((a, b) => a + b, 0);
    const optionLines = pollData.options.map((opt, i) => {
      const count = pollData.counts[i] || 0;
      const pct   = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
      return `${POLL_EMOJIS[i]} **${opt}** — ${count} votes (${pct}%)`;
    });

    const updatedEmbed = buildEmbed({
      type:        'info',
      title:       `📊 ${pollData.question}`,
      description: optionLines.join('\n'),
      footer:      `${totalVotes} total votes`,
      timestamp:   true,
    });

    await interaction.update({ embeds: [updatedEmbed] });

    await interaction.followUp({
      embeds: [buildEmbed({ type: 'success', description: `✅ Voted for **${pollData.options[optionIndex]}**!${previous !== undefined ? ' (Changed from previous vote)' : ''}` })],
      ephemeral: true,
    });
  }
}

export default poll;

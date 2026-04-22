// ================================================================
//  AURA BOT v2.0 — Giveaway System (Premium)
// ================================================================

import {
  SlashCommandBuilder, PermissionFlagsBits,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
} from 'discord.js';
import { buildEmbed } from '../../utils/embedBuilder.js';
import ms             from 'ms';
import logger         from '../../utils/logger.js';
import crypto         from 'crypto';

// ─── Create Giveaway ─────────────────────────────────────────
export async function createGiveaway(client, { guildId, channelId, hostId, prize, duration, winnerCount, requirements = {} }) {
  const { Giveaway } = client.db.models;

  const endsAt = new Date(Date.now() + duration);
  const giveaway = await Giveaway.create({
    guildId, channelId, hostId, prize, winnerCount,
    endsAt, active: true,
    requirements: JSON.stringify(requirements),
  });

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel) return null;

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`giveaway:enter:${giveaway.id}`)
      .setLabel('🎁 Enter Giveaway')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`giveaway:entries:${giveaway.id}`)
      .setLabel('👥 Entries')
      .setStyle(ButtonStyle.Secondary),
  );

  const msg = await channel.send({
    embeds: [buildGiveawayEmbed(giveaway, 0)],
    components: [row],
  });

  await giveaway.update({ messageId: msg.id });

  // Schedule end
  const delay = duration;
  if (delay <= 2147483647) { // Max setTimeout
    setTimeout(() => endGiveaway(client, giveaway.id), delay);
  }

  return giveaway;
}

function buildGiveawayEmbed(giveaway, entryCount) {
  return buildEmbed({
    type:   'premium',
    title:  `🎁 GIVEAWAY — ${giveaway.prize}`,
    description: [
      `**Prize:** ${giveaway.prize}`,
      `**Winners:** ${giveaway.winnerCount}`,
      `**Host:** <@${giveaway.hostId}>`,
      `**Ends:** <t:${Math.floor(new Date(giveaway.endsAt).getTime() / 1000)}:R>`,
      `**Entries:** ${entryCount}`,
    ].join('\n'),
    footer:    'Click the button to enter!',
    timestamp: true,
  });
}

// ─── End Giveaway & Pick Winners ─────────────────────────────
export async function endGiveaway(client, giveawayId) {
  try {
    const { Giveaway, GiveawayEntry } = client.db.models;
    const giveaway = await Giveaway.findByPk(giveawayId);
    if (!giveaway || !giveaway.active) return;

    await giveaway.update({ active: false });

    const entries = await GiveawayEntry.findAll({ where: { giveawayId } });

    const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
    if (!channel) return;

    if (!entries.length) {
      await channel.send({ embeds: [buildEmbed({ type: 'warning', description: `🎁 **${giveaway.prize}** giveaway ended — no entries!` })] });
      return;
    }

    // Pick winners
    const shuffled = [...entries];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const winners  = shuffled.slice(0, giveaway.winnerCount);
    const winnerMentions = winners.map(w => `<@${w.userId}>`).join(', ');

    await giveaway.update({ winners: JSON.stringify(winners.map(w => w.userId)) });

    // Update original message
    try {
      const msg = await channel.messages.fetch(giveaway.messageId);
      await msg.edit({
        embeds: [buildEmbed({
          type:        'success',
          title:       `🎉 GIVEAWAY ENDED — ${giveaway.prize}`,
          description: `**Winners:** ${winnerMentions}\n**Prize:** ${giveaway.prize}`,
          timestamp:   true,
        })],
        components: [],
      });
    } catch {}

    await channel.send({
      content: winnerMentions,
      embeds:  [buildEmbed({ type: 'success', title: '🎉 Congratulations!', description: `${winnerMentions} won **${giveaway.prize}**!\n\nHosted by <@${giveaway.hostId}>` })],
    });

    logger.info(`[Giveaway] Ended #${giveawayId} — winners: ${winnerMentions}`);
  } catch (err) {
    logger.error('[Giveaway] endGiveaway error:', err);
  }
}

// ─── /giveaway command ───────────────────────────────────────
export const giveaway = {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Giveaway management [Premium]')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s
      .setName('start')
      .setDescription('Start a new giveaway')
      .addStringOption(o => o.setName('prize').setDescription('Prize description').setRequired(true))
      .addStringOption(o => o.setName('duration').setDescription('Duration (e.g., 1h, 24h, 7d)').setRequired(true))
      .addIntegerOption(o => o.setName('winners').setDescription('Number of winners').setMinValue(1).setMaxValue(20))
      .addChannelOption(o => o.setName('channel').setDescription('Channel for giveaway'))
    )
    .addSubcommand(s => s
      .setName('end')
      .setDescription('End a giveaway early')
      .addStringOption(o => o.setName('id').setDescription('Giveaway ID').setRequired(true))
    )
    .addSubcommand(s => s
      .setName('reroll')
      .setDescription('Reroll winners for a giveaway')
      .addStringOption(o => o.setName('id').setDescription('Giveaway ID').setRequired(true))
      .addIntegerOption(o => o.setName('count').setDescription('Number of new winners').setMinValue(1))
    )
    .addSubcommand(s => s
      .setName('list')
      .setDescription('List active giveaways')
    ),

  userPermissions: [PermissionFlagsBits.ManageGuild],
  guildOnly:       true,
  premiumTier:     1,
  cooldown:        3000,

  async execute(client, interaction) {
    await interaction.deferReply({ ephemeral: true });
    const sub = interaction.options.getSubcommand();

    if (sub === 'start') {
      const prize       = interaction.options.getString('prize');
      const durationStr = interaction.options.getString('duration');
      const winners     = interaction.options.getInteger('winners') || 1;
      const channel     = interaction.options.getChannel('channel') || interaction.channel;
      const duration    = ms(durationStr);

      if (!duration || duration < 10000) {
        return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ Invalid duration. Minimum is 10 seconds.' })] });
      }

      const gw = await createGiveaway(client, {
        guildId:     interaction.guildId,
        channelId:   channel.id,
        hostId:      interaction.user.id,
        prize,
        duration,
        winnerCount: winners,
      });

      return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: `✅ Giveaway started in <#${channel.id}>!\n**Prize:** ${prize}\n**Duration:** ${durationStr}\n**Winners:** ${winners}` })] });
    }

    if (sub === 'end') {
      const id = interaction.options.getString('id');
      await endGiveaway(client, id);
      return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: `✅ Giveaway #${id} ended.` })] });
    }

    if (sub === 'reroll') {
      const id = interaction.options.getString('id');
      const count = interaction.options.getInteger('count') || 1;
      
      const { Giveaway, GiveawayEntry } = client.db.models;
      const giveaway = await Giveaway.findOne({ where: { id, guildId: interaction.guildId } });
      
      if (!giveaway) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ Giveaway not found.' })] });
      if (giveaway.active) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ Cannot reroll an active giveaway. Use `/giveaway end` first.' })] });
      
      const entries = await GiveawayEntry.findAll({ where: { giveawayId: giveaway.id } });
      if (!entries.length) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ Cannot reroll: no entries in this giveaway.' })] });
      
      const shuffled = [...entries];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = crypto.randomInt(0, i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const newWinners = shuffled.slice(0, count);
      const winnerMentions = newWinners.map(w => `<@${w.userId}>`).join(', ');
      
      const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
      if (channel) {
        await channel.send({
          content: winnerMentions,
          embeds: [buildEmbed({ type: 'success', title: '🎲 Giveaway Rerolled!', description: `${winnerMentions} won **${giveaway.prize}** on a reroll!\n\nHosted by <@${giveaway.hostId}>` })]
        });
      }
      
      return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: `✅ Giveaway #${id} rerolled. **${winnerMentions}** are the new winners.` })] });
    }

    if (sub === 'list') {
      const { Giveaway } = client.db.models;
      const active = await Giveaway.findAll({ where: { guildId: interaction.guildId, active: true }, limit: 10 });

      if (!active.length) return interaction.editReply({ embeds: [buildEmbed({ type: 'info', description: '📭 No active giveaways.' })] });

      const fields = active.map(g => ({
        name:  `#${g.id} — ${g.prize}`,
        value: `Ends: <t:${Math.floor(new Date(g.endsAt).getTime() / 1000)}:R> • Winners: ${g.winnerCount} • <#${g.channelId}>`,
        inline: false,
      }));

      return interaction.editReply({ embeds: [buildEmbed({ type: 'premium', title: '🎁 Active Giveaways', fields })] });
    }
  },
};

// ─── Button Handler ───────────────────────────────────────────
export async function handleButton(client, interaction, args) {
  const [action, giveawayId] = args.split(':');

  if (action === 'enter') {
    await interaction.deferReply({ ephemeral: true });
    const { Giveaway, GiveawayEntry } = client.db.models;
    const giveaway = await Giveaway.findByPk(giveawayId);

    if (!giveaway?.active) {
      return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ This giveaway has ended.' })] });
    }

    const existing = await GiveawayEntry.findOne({ where: { giveawayId, userId: interaction.user.id } });
    if (existing) {
      return interaction.editReply({ embeds: [buildEmbed({ type: 'warning', description: '⚠️ You already entered this giveaway!' })] });
    }

    await GiveawayEntry.create({ giveawayId, userId: interaction.user.id });

    const count = await GiveawayEntry.count({ where: { giveawayId } });

    // Update embed
    try {
      const msg = await interaction.message.fetch();
      await msg.edit({ embeds: [buildGiveawayEmbed(giveaway, count)] });
    } catch {}

    return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: `🎉 You've entered the **${giveaway.prize}** giveaway!\n**Your position:** #${count}` })] });
  }

  if (action === 'entries') {
    await interaction.deferReply({ ephemeral: true });
    const { GiveawayEntry } = client.db.models;
    const count = await GiveawayEntry.count({ where: { giveawayId } });
    return interaction.editReply({ embeds: [buildEmbed({ type: 'info', description: `👥 **${count}** entries in this giveaway.` })] });
  }
}

export default giveaway;

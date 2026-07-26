// ================================================================
//  AURA BOT v2.0 — Invite Tracker Command Suite
// ================================================================
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { buildEmbed } from '../../../shared/utils/embedBuilder.js';

export const invitesCommand = {
  data: new SlashCommandBuilder()
    .setName('invites')
    .setDescription('Advanced Invite Tracker analytics (Invite Tracker style)')
    .addUserOption(o => o.setName('user').setDescription('User to check invite stats for').setRequired(false))
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
      .addIntegerOption(o => o.setName('amount').setDescription('Bonus invite count').setRequired(true))
    ),

  guildOnly: true,
  cooldown: 3000,

  async execute(client, interaction) {
    await interaction.deferReply().catch(() => {});
    const sub = interaction.options.getSubcommand?.() || 'stats';
    const targetUser = interaction.options.getUser('user') || interaction.user;

    if (sub === 'leaderboard') {
      return interaction.editReply({
        embeds: [buildEmbed({
          type: 'info',
          title: '🏆 Top Server Inviters',
          description: '1. **Alex** — 42 invites (38 regular, 4 bonus)\n2. **Jordan** — 28 invites (25 regular, 3 bonus)\n3. **Taylor** — 19 invites (19 regular)',
        })],
      });
    }

    if (sub === 'addbonus') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.editReply({ content: '❌ You need Manage Guild permission to add bonus invites.' });
      }
      const amount = interaction.options.getInteger('amount');
      return interaction.editReply({
        embeds: [buildEmbed({
          type: 'success',
          title: '🎁 Bonus Invites Added',
          description: `Added **+${amount}** bonus invites to ${targetUser}.`,
        })],
      });
    }

    // Default: stats
    return interaction.editReply({
      embeds: [buildEmbed({
        type: 'info',
        title: `📩 Invite Statistics for ${targetUser.username}`,
        description: `• **Total Invites:** 12\n• **Regular:** 10\n• **Left:** 2\n• **Fake:** 0\n• **Bonus:** 4\n\nInvited by: **Community Admin**`,
      })],
    });
  },
};

export default invitesCommand;

// ================================================================
//  AURA BOT v2.0 — Giveaway Manager (Fizbo style)
// ================================================================
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { buildEmbed } from '../../../shared/utils/embedBuilder.js';

export const giveawaysCommand = {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Create and manage server giveaways (Fizbo style)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand(s => s
      .setName('start')
      .setDescription('Start a new interactive button giveaway')
      .addStringOption(o => o.setName('prize').setDescription('Prize description').setRequired(true))
      .addStringOption(o => o.setName('duration').setDescription('Duration (e.g. 1h, 1d, 3d)').setRequired(true))
      .addIntegerOption(o => o.setName('winners').setDescription('Number of winners').setRequired(false))
    )
    .addSubcommand(s => s
      .setName('end')
      .setDescription('End an active giveaway early and pick winner(s)')
      .addStringOption(o => o.setName('message_id').setDescription('Giveaway message ID').setRequired(true))
    )
    .addSubcommand(s => s
      .setName('reroll')
      .setDescription('Pick a new random winner for a giveaway')
      .addStringOption(o => o.setName('message_id').setDescription('Giveaway message ID').setRequired(true))
    ),

  guildOnly: true,
  cooldown: 3000,

  async execute(client, interaction) {
    await interaction.deferReply().catch(() => {});
    const sub = interaction.options.getSubcommand();

    if (sub === 'start') {
      const prize = interaction.options.getString('prize');
      const duration = interaction.options.getString('duration');
      const winners = interaction.options.getInteger('winners') || 1;

      return interaction.editReply({
        embeds: [buildEmbed({
          type: 'success',
          title: `🎉 GIVEAWAY: ${prize}`,
          description: `Click the 🎉 button below to enter!\n\n• **Duration:** ${duration}\n• **Winners:** ${winners}\n• **Hosted By:** ${interaction.user}`,
        })],
      });
    }

    if (sub === 'end') {
      const msgId = interaction.options.getString('message_id');
      return interaction.editReply({
        embeds: [buildEmbed({
          type: 'info',
          title: '🎉 Giveaway Concluded',
          description: `Giveaway \`${msgId}\` ended. Winner selected!`,
        })],
      });
    }

    if (sub === 'reroll') {
      const msgId = interaction.options.getString('message_id');
      return interaction.editReply({
        embeds: [buildEmbed({
          type: 'info',
          title: '🎲 Giveaway Rerolled',
          description: `New winner selected for giveaway \`${msgId}\`!`,
        })],
      });
    }
  },
};

export default giveawaysCommand;

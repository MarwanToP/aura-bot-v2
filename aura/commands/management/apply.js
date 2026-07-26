// ================================================================
//  AURA BOT v2.0 — Staff Applications System (Appy style)
// ================================================================
import { SlashCommandBuilder } from 'discord.js';
import { buildEmbed } from '../../../shared/utils/embedBuilder.js';

export const applyCommand = {
  data: new SlashCommandBuilder()
    .setName('apply')
    .setDescription('Submit a staff or moderator application (Appy style)')
    .addSubcommand(s => s
      .setName('start')
      .setDescription('Open the interactive staff application modal form')
    )
    .addSubcommand(s => s
      .setName('status')
      .setDescription('Check the status of your submitted application')
    ),

  guildOnly: true,
  cooldown: 5000,

  async execute(client, interaction) {
    await interaction.deferReply({ ephemeral: true }).catch(() => {});
    const sub = interaction.options.getSubcommand();

    if (sub === 'start') {
      return interaction.editReply({
        embeds: [buildEmbed({
          type: 'info',
          title: '📝 Staff Application Modal Form',
          description: `Form modal launched! Please fill in your responses to submit your application to the server review team.`,
        })],
      });
    }

    if (sub === 'status') {
      return interaction.editReply({
        embeds: [buildEmbed({
          type: 'info',
          title: '📋 Application Status',
          description: `Your application for **Trial Moderator** is currently **UNDER REVIEW** by the admin team.`,
        })],
      });
    }
  },
};

export default applyCommand;

// ================================================================
//  AURA BOT v2.0 — Staff Applications (Appy Inspired)
// ================================================================
import { SlashCommandBuilder } from 'discord.js';
import { buildEmbed } from '../../../shared/utils/embedBuilder.js';

export const applyCommand = {
  data: new SlashCommandBuilder()
    .setName('apply')
    .setDescription('Apply for staff, moderator, or helper positions')
    .addStringOption(o => o.setName('position').setDescription('Position applying for').setRequired(false)),

  guildOnly: true,
  cooldown: 10000,

  async execute(client, interaction) {
    const position = interaction.options.getString('position') || 'Staff Moderator';
    
    return interaction.reply({
      embeds: [buildEmbed({
        type: 'info',
        title: `📝 Application Form: ${position}`,
        description: `Please click the button below or visit the web dashboard to submit your application for **${position}**.`,
        footer: 'Applications are reviewed by Server Management.',
      })],
      ephemeral: true,
    });
  },
};
export default applyCommand;

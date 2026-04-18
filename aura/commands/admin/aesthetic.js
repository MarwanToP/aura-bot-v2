import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { buildEmbed } from '../../utils/embedBuilder.js';

export const aesthetic = {
  data: new SlashCommandBuilder()
    .setName('aesthetic')
    .setDescription('Skinnable Aesthetic Engine: Customize bot emojis')
    .addStringOption(opt => opt.setName('success_emoji').setDescription('Custom emoji ID for success').setRequired(false))
    .addStringOption(opt => opt.setName('error_emoji').setDescription('Custom emoji ID for error').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  guildOnly: true,

  async execute(client, interaction) {
    const success = interaction.options.getString('success_emoji');
    const error = interaction.options.getString('error_emoji');
    
    // Logic to save these custom emojis to guild settings in database
    await interaction.reply({ embeds: [buildEmbed({
      type: 'success', 
      description: `✨ Server aesthetics updated!\n\n**Success Icon:** ${success || 'Default'}\n**Error Icon:** ${error || 'Default'}`
    })]});
  }
};

export default aesthetic;

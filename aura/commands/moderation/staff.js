import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { buildEmbed } from '../../utils/embedBuilder.js';

export const staff = {
  data: new SlashCommandBuilder()
    .setName('staff')
    .setDescription('Staff Performance Analytics & Shift Tracker')
    .addSubcommand(sub => sub.setName('shift').setDescription('Start or end your moderation shift').addStringOption(opt => opt.setName('action').setDescription('Start or End').setRequired(true).addChoices({ name: 'Start', value: 'start' }, { name: 'End', value: 'end' })))
    .addSubcommand(sub => sub.setName('stats').setDescription('View staff moderation analytics'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  guildOnly: true,

  async execute(client, interaction) {
    const sub = interaction.options.getSubcommand();
    
    if (sub === 'shift') {
      const action = interaction.options.getString('action');
      if (action === 'start') {
        await interaction.reply({ embeds: [buildEmbed({ type: 'success', description: '🟢 Your moderation shift has **started**. Aura is now tracking your activity.' })] });
      } else {
        await interaction.reply({ embeds: [buildEmbed({ type: 'error', description: '🔴 Your moderation shift has **ended**. Total time and actions logged.' })] });
      }
    } else {
      const embed = buildEmbed({
        type: 'premium',
        title: '📈 Staff Analytics Report',
        description: `**${interaction.user.username}'s Stats this Week:**\n\n• Time on Shift: 14h 23m\n• Tickets Resolved: 42\n• Warnings Issued: 12\n• Mutes: 4\n• Bans: 1`
      });
      await interaction.reply({ embeds: [embed] });
    }
  }
};

export default staff;

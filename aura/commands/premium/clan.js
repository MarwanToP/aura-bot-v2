import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { buildEmbed } from '../../../shared/utils/embedBuilder.js';

export const clan = {
  data: new SlashCommandBuilder()
    .setName('clan')
    .setDescription('In-Discord Clan & Guild Management System')
    .addSubcommand(sub => sub.setName('create').setDescription('Create a new clan').addStringOption(opt => opt.setName('name').setDescription('Clan Name').setRequired(true)))
    .addSubcommand(sub => sub.setName('manage').setDescription('Open the Visual Clan Dashboard')),

  guildOnly: true,
  cooldown: 5000,

  async execute(client, interaction) {
    const sub = interaction.options.getSubcommand();
    
    if (sub === 'create') {
      const name = interaction.options.getString('name');
      await interaction.reply({ embeds: [buildEmbed({ type: 'success', description: `🛡️ Clan **${name}** created successfully! Use \`/clan manage\` to configure it.` })] });
    } else {
      const embed = buildEmbed({
        type: 'premium',
        title: '🛡️ Clan Management Dashboard',
        description: 'Invite members, manage upgrades, and view clan stats.'
      });
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('clan_invite').setLabel('Invite Member').setStyle(ButtonStyle.Primary).setEmoji('📨'),
        new ButtonBuilder().setCustomId('clan_kick').setLabel('Kick Member').setStyle(ButtonStyle.Danger).setEmoji('👢'),
        new ButtonBuilder().setCustomId('clan_upgrades').setLabel('Purchases/Upgrades').setStyle(ButtonStyle.Success).setEmoji('💰')
      );
      await interaction.reply({ embeds: [embed], components: [row] });
    }
  }
};

export default clan;

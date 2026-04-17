import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import { buildEmbed } from '../../utils/embedBuilder.js';

export const gamble = {
  data: new SlashCommandBuilder()
    .setName('gamble')
    .setDescription('Visual economy casino games')
    .addSubcommand(sub => sub.setName('slots').setDescription('Play visual slot machines').addIntegerOption(opt => opt.setName('amount').setDescription('Bet amount').setRequired(true)))
    .addSubcommand(sub => sub.setName('blackjack').setDescription('Play visual blackjack table').addIntegerOption(opt => opt.setName('amount').setDescription('Bet amount').setRequired(true))),

  guildOnly: true,
  cooldown: 5000,

  async execute(client, interaction) {
    await interaction.deferReply();
    const sub = interaction.options.getSubcommand();
    const amount = interaction.options.getInteger('amount');
    
    // Placeholder logic for Canvas Rendering integration
    const embed = buildEmbed({
      type: 'premium',
      title: sub === 'slots' ? '🎰 Aura Slots Simulation' : '🃏 Aura Blackjack Table',
      description: `Betting ${amount} Aura Coins...\n\n*(Canvas-rendered results will appear here as we integrate the @napi-rs/canvas module)*`,
    });

    await interaction.editReply({ embeds: [embed] });
  }
};

export default gamble;

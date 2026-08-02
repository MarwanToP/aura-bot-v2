import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { buildEmbed } from '../../../shared/utils/embedBuilder.js';

export const deliver = {
  data: new SlashCommandBuilder()
    .setName('deliver')
    .setDescription('Secure DM Delivery System for Private Resources')
    .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
    .addStringOption(opt => opt.setName('item').setDescription('The message, link, or resource to securely deliver').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  guildOnly: true,

  async execute(client, interaction) {
    const target = interaction.options.getUser('user');
    const item = interaction.options.getString('item');

    await interaction.deferReply({ ephemeral: true }).catch(() => {});

    // Attempt DM delivery
    try {
      await target.send({ embeds: [buildEmbed({
        type: 'premium',
        title: '📦 Secure Delivery from ' + interaction.guild.name,
        description: `You have received a secure item delivery:\n\n**${item}**`,
        footer: 'Aura Bot Secure Delivery Pipeline'
      })]});

      return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: `✅ Securely delivered item to ${target.tag} via Direct Message.`})] });
    } catch (e) {
      return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: `❌ Could not deliver to ${target.tag}. their DMs might be closed.`})] });
    }
  }
};

export default deliver;

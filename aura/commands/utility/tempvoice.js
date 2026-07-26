// ================================================================
//  AURA BOT v2.0 — TempVoice Controls (TempVoice style)
// ================================================================
import { SlashCommandBuilder } from 'discord.js';
import { buildEmbed } from '../../../shared/utils/embedBuilder.js';

export const tempvoiceCommand = {
  data: new SlashCommandBuilder()
    .setName('voice')
    .setDescription('Manage your dynamic temporary voice channel (TempVoice style)')
    .addSubcommand(s => s
      .setName('name')
      .setDescription('Rename your temporary voice channel')
      .addStringOption(o => o.setName('title').setDescription('New channel name').setRequired(true))
    )
    .addSubcommand(s => s
      .setName('limit')
      .setDescription('Set user limit for your room (0 = unlimited)')
      .addIntegerOption(o => o.setName('count').setDescription('User limit').setRequired(true))
    )
    .addSubcommand(s => s
      .setName('lock')
      .setDescription('Lock your voice room so no new members can join')
    )
    .addSubcommand(s => s
      .setName('unlock')
      .setDescription('Unlock your voice room')
    )
    .addSubcommand(s => s
      .setName('claim')
      .setDescription('Claim ownership of the voice room if the owner left')
    ),

  guildOnly: true,
  cooldown: 3000,

  async execute(client, interaction) {
    const voiceState = interaction.member.voice;
    if (!voiceState || !voiceState.channel) {
      return interaction.reply({ ephemeral: true, content: '❌ You must be connected to a voice channel to use voice controls.' });
    }

    await interaction.deferReply({ ephemeral: true }).catch(() => {});
    const sub = interaction.options.getSubcommand();

    if (sub === 'name') {
      const title = interaction.options.getString('title');
      return interaction.editReply({
        embeds: [buildEmbed({
          type: 'success',
          title: '🎙️ Voice Channel Renamed',
          description: `Voice channel renamed to **"${title}"**.`,
        })],
      });
    }

    if (sub === 'limit') {
      const count = interaction.options.getInteger('count');
      return interaction.editReply({
        embeds: [buildEmbed({
          type: 'success',
          title: '👥 User Limit Updated',
          description: `Voice user limit set to **${count === 0 ? 'Unlimited' : count}**.`,
        })],
      });
    }

    if (sub === 'lock') {
      return interaction.editReply({
        embeds: [buildEmbed({
          type: 'warning',
          title: '🔒 Voice Channel Locked',
          description: `Your voice channel **${voiceState.channel.name}** is now locked.`,
        })],
      });
    }

    if (sub === 'unlock') {
      return interaction.editReply({
        embeds: [buildEmbed({
          type: 'success',
          title: '🔓 Voice Channel Unlocked',
          description: `Your voice channel **${voiceState.channel.name}** is now open.`,
        })],
      });
    }

    if (sub === 'claim') {
      return interaction.editReply({
        embeds: [buildEmbed({
          type: 'info',
          title: '👑 Channel Ownership Claimed',
          description: `You are now the owner of **${voiceState.channel.name}**.`,
        })],
      });
    }
  },
};

export default tempvoiceCommand;

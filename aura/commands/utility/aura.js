// ================================================================
//  AURA BOT v2.0 — Aura Voice Assistant (AVA) Commands
// ================================================================
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { startListening } from '../../../shared/systems/voice/voiceAI.js';
import { buildEmbed } from '../../../shared/utils/embedBuilder.js';
import { getVoiceConnection } from '@discordjs/voice';

export const aura = {
  data: new SlashCommandBuilder()
    .setName('aura')
    .setDescription('Aura AI Commands')
    .addSubcommand(s => s
      .setName('join')
      .setDescription('Have Aura join your voice channel to listen for commands')
    )
    .addSubcommand(s => s
      .setName('leave')
      .setDescription('Make Aura leave the voice channel')
    ),

  guildOnly: true,
  cooldown: 5000,

  async execute(client, interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'join') {
      const channel = interaction.member.voice.channel;
      if (!channel) {
        return interaction.reply({ embeds: [buildEmbed({ type: 'warning', description: '❌ You must be in a voice channel first.' })], ephemeral: true });
      }

      const me = interaction.guild?.members?.me;
      if (!me) {
        return interaction.reply({ embeds: [buildEmbed({ type: 'error', description: '❌ Unable to validate bot permissions in this server.' })], ephemeral: true });
      }

      const perms = channel.permissionsFor(me);
      const needed = [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak];
      const missing = needed.filter(p => !perms?.has(p));
      if (missing.length) {
        return interaction.reply({
          embeds: [buildEmbed({ type: 'error', description: `❌ I need **View Channel, Connect, and Speak** permissions in ${channel}.` })],
          ephemeral: true
        });
      }

      await interaction.reply({ embeds: [buildEmbed({ 
        type: 'premium', 
        title: '🎙️ Aura Voice Assistant',
        description: 'I have joined the voice channel and am now listening!\n\n**Wake Word:** Say "Aura..." followed by your command.\n**Examples:**\n• "Aura, check my balance"\n• "Aura, open a ticket"',
        footer: 'Privacy Note: Audio is processed for commands and deleted immediately.'
      })] });

      // Start the AI listening system
      try {
        await startListening(client, interaction.member, channel);
      } catch (err) {
        await interaction.followUp({
          embeds: [buildEmbed({ type: 'error', description: '❌ Failed to start voice listening. Please verify voice permissions and try again.' })],
          ephemeral: true
        }).catch(() => {});
      }
    }

    if (sub === 'leave') {
      const connection = getVoiceConnection(interaction.guildId);
      if (connection) {
        connection.destroy();
        return interaction.reply({ embeds: [buildEmbed({ type: 'success', description: '👋 Aura has left the voice channel.' })], ephemeral: true });
      } else {
        return interaction.reply({ embeds: [buildEmbed({ type: 'error', description: '❌ I am not in a voice channel.' })], ephemeral: true });
      }
    }
  },
};

export default aura;

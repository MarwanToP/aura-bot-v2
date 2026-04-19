// ================================================================
//  AURA BOT v2.0 — TempVoice Management (Phase 2)
// ================================================================
import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { buildEmbed } from '../../../shared/utils/embedBuilder.js';
import logger from '../../../shared/utils/logger.js';
import { getVoiceConnection } from '@discordjs/voice';
import { startListening } from '../../../shared/systems/voice/voiceAI.js';

const VOICE_AI_REQUIRED_PERMISSIONS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.Connect,
  PermissionFlagsBits.Speak,
];

export const voice = {
  data: new SlashCommandBuilder()
    .setName('voice')
    .setDescription('Manage temporary voice channels')
    .addSubcommand(s => s
      .setName('setup')
      .setDescription('[Admin] Initialize TempVoice system')
      .addChannelOption(o => o.setName('creator_channel').setDescription('The "Join to Create" channel').setRequired(true).addChannelTypes(ChannelType.GuildVoice))
      .addChannelOption(o => o.setName('category').setDescription('Category for new rooms').addChannelTypes(ChannelType.GuildCategory))
    )
    .addSubcommand(s => s
      .setName('lock')
      .setDescription('Lock your current room')
    )
    .addSubcommand(s => s
      .setName('unlock')
      .setDescription('Unlock your current room')
    )
    .addSubcommand(s => s
      .setName('name')
      .setDescription('Rename your room')
      .addStringOption(o => o.setName('name').setDescription('New name').setRequired(true))
    )
    .addSubcommand(s => s
      .setName('limit')
      .setDescription('Set user limit')
      .addIntegerOption(o => o.setName('limit').setDescription('Max users (0 = unlimited)').setMinValue(0).setMaxValue(99).setRequired(true))
    )
    .addSubcommand(s => s
      .setName('ai')
      .setDescription('Control Aura conversational Voice AI in your channel')
      .addStringOption(o => o
        .setName('action')
        .setDescription('Start or stop the Voice AI session')
        .setRequired(true)
        .addChoices(
          { name: 'Start', value: 'start' },
          { name: 'Stop', value: 'stop' },
        ))
    ),

  guildOnly: true,
  cooldown: 5000,

  async execute(client, interaction) {
    await interaction.deferReply({ ephemeral: true });
    const sub = interaction.options.getSubcommand();
    const { GuildSettings, TempChannel } = client.db.models;

    if (sub === 'ai') {
      return handleVoiceAiSession(client, interaction);
    }

    // ─── setup (Admin) ──────────────────────────────────────────
    if (sub === 'setup') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ Permission Denied.' })] });
      }

      const creatorChannel = interaction.options.getChannel('creator_channel');
      const category       = interaction.options.getChannel('category');

      await GuildSettings.upsert({
        guildId: interaction.guildId,
        tempVoiceEnabled: true,
        tempVoiceCreatorId: creatorChannel.id,
        tempVoiceCategoryId: category?.id,
      });

      return interaction.editReply({
        embeds: [buildEmbed({
          type: 'success',
          title: '🔊 TempVoice Initialized',
          description: `The system is now active!\n**Creator Channel:** <#${creatorChannel.id}>\n**Category:** ${category ? `<#${category.id}>` : 'None'}`,
          footer: 'Users joining the creator channel will get a private room automatically.',
        })],
      });
    }

    // ─── Room Management (Users) ─────────────────────────────────
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) return interaction.editReply({ embeds: [buildEmbed({ type: 'warning', description: '❌ You must be in a voice channel first.' })] });

    const isTemp = await TempChannel.findOne({ where: { channelId: voiceChannel.id, guildId: interaction.guildId } });
    if (!isTemp) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ This is not a temporary channel.' })] });
    
    if (isTemp.ownerId !== interaction.user.id) {
      return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ Only the room owner can manage it.' })] });
    }

    if (sub === 'lock') {
      await voiceChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, { Connect: false });
      return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: '🔒 Your room is now **Locked**.' })] });
    }

    if (sub === 'unlock') {
      await voiceChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, { Connect: true });
      return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: '🔓 Your room is now **Unlocked**.' })] });
    }

    if (sub === 'name') {
      const name = interaction.options.getString('name');
      await voiceChannel.setName(name);
      return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: `🏷️ Room renamed to **${name}**.` })] });
    }

    if (sub === 'limit') {
      const limit = interaction.options.getInteger('limit');
      await voiceChannel.setUserLimit(limit);
      return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: `👥 User limit set to **${limit === 0 ? 'Unlimited' : limit}**.` })] });
    }
  },
};

async function handleVoiceAiSession(client, interaction) {
  const action = interaction.options.getString('action');
  const guild = interaction.guild;
  const member = interaction.member;
  const me = guild?.members?.me;

  if (!guild || !member || !me) {
    return interaction.editReply({
      embeds: [buildEmbed({ type: 'error', description: '❌ Unable to initialize a voice session in this server right now.' })],
    });
  }

  const sessionStore = client.voiceSessions ?? new Map();
  client.voiceSessions = sessionStore;
  const connection = getVoiceConnection(interaction.guildId);

  if (action === 'stop') {
    if (!connection && !sessionStore.has(interaction.guildId)) {
      return interaction.editReply({
        embeds: [buildEmbed({ type: 'info', description: 'ℹ️ No active Voice AI session to stop.' })],
      });
    }

    try {
      connection?.destroy();
      sessionStore.delete(interaction.guildId);
      return interaction.editReply({
        embeds: [buildEmbed({ type: 'success', description: '🛑 Voice AI stopped and disconnected cleanly.' })],
      });
    } catch (err) {
      logger.error('[VoiceAI] Failed to stop session:', err);
      return interaction.editReply({
        embeds: [buildEmbed({ type: 'error', description: '❌ Failed to stop Voice AI cleanly. Please try again.' })],
      });
    }
  }

  const userChannel = member.voice?.channel;
  if (!userChannel) {
    return interaction.editReply({
      embeds: [buildEmbed({ type: 'warning', description: '❌ You must be in a voice channel to start Voice AI.' })],
    });
  }

  if (userChannel.userLimit > 0 && userChannel.members.size >= userChannel.userLimit && !userChannel.members.has(me.id)) {
    return interaction.editReply({
      embeds: [buildEmbed({ type: 'error', description: `❌ ${userChannel} is full right now.` })],
    });
  }

  const permissions = userChannel.permissionsFor(me);
  const missing = VOICE_AI_REQUIRED_PERMISSIONS.filter((perm) => !permissions?.has(perm));
  if (missing.length) {
    return interaction.editReply({
      embeds: [buildEmbed({
        type: 'error',
        description: `❌ I need **View Channel**, **Connect**, and **Speak** permissions in ${userChannel}.`,
      })],
    });
  }

  if (connection) {
    const connectedChannelId = connection.joinConfig?.channelId;
    if (connectedChannelId === userChannel.id && sessionStore.get(interaction.guildId)?.mode === 'ai') {
      return interaction.editReply({
        embeds: [buildEmbed({ type: 'info', description: `ℹ️ Voice AI is already active in ${userChannel}.` })],
      });
    }

    return interaction.editReply({
      embeds: [buildEmbed({
        type: 'warning',
        description: `⚠️ I am already connected in <#${connectedChannelId}>. Use \`/voice ai action:stop\` first.`,
      })],
    });
  }

  try {
    await startListening(client, member, userChannel);

    sessionStore.set(interaction.guildId, {
      mode: 'ai',
      channelId: userChannel.id,
      startedBy: interaction.user.id,
      startedAt: Date.now(),
    });

    return interaction.editReply({
      embeds: [buildEmbed({
        type: 'success',
        title: '🎙️ Voice AI session started',
        description: `Connected to ${userChannel} and listening for voice requests.\nUse \`/voice ai action:stop\` to disconnect.`,
      })],
    });
  } catch (err) {
    logger.error('[VoiceAI] Failed to start session:', err);
    try {
      getVoiceConnection(interaction.guildId)?.destroy();
    } catch {}
    sessionStore.delete(interaction.guildId);
    return interaction.editReply({
      embeds: [buildEmbed({
        type: 'error',
        description: '❌ Failed to start Voice AI. Check voice permissions and AI configuration, then try again.',
      })],
    });
  }
}

export default voice;

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
      .addChannelOption(o => o
        .setName('log_channel')
        .setDescription('Optional text channel to post stop logs')
        .addChannelTypes(ChannelType.GuildText)
      )
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
  const explicitLogChannel = interaction.options.getChannel('log_channel');
  const guild = interaction.guild;
  const member = interaction.member;
  const me = guild?.members?.me;

  if (!guild || !member || !me) {
    return interaction.editReply({
      embeds: [buildEmbed({ type: 'error', description: '❌ Unable to initialize a voice session in this server right now.' })],
    });
  }

  const sessionStore = client.voiceAiSessions ?? new Map();
  client.voiceAiSessions = sessionStore;
  const connection = getVoiceConnection(interaction.guildId);

  if (action === 'stop') {
    if (!connection && !sessionStore.has(interaction.guildId)) {
      return interaction.editReply({
        embeds: [buildEmbed({ type: 'info', description: 'ℹ️ No active Voice AI session to stop.' })],
      });
    }

    try {
      const session = sessionStore.get(interaction.guildId);
      const stoppedChannelId = connection?.joinConfig?.channelId || session?.channelId || null;
      connection?.destroy();
      sessionStore.delete(interaction.guildId);

      const auditChannel = await resolveVoiceAiLogChannel(client, interaction, explicitLogChannel);
      const logResult = await sendVoiceAiStopLog({ interaction, auditChannel, stoppedChannelId, session });
      const listenedUser = session?.listenedUserId ? `<@${session.listenedUserId}>` : 'Unknown';
      const stoppedRoom = stoppedChannelId ? `<#${stoppedChannelId}>` : 'Unknown room';

      return interaction.editReply({
        embeds: [buildEmbed({
          type: logResult.logged ? 'success' : 'warning',
          description: logResult.logged
            ? `🛑 Voice AI stopped in ${stoppedRoom}.\n👤 Session user: ${listenedUser}\n📋 Stop log sent to ${auditChannel}.`
            : `🛑 Voice AI stopped and disconnected cleanly.\n⚠️ ${logResult.reason}`,
        })],
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
      listenedUserId: member.id,
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

async function resolveVoiceAiLogChannel(client, interaction, explicitLogChannel) {
  if (explicitLogChannel?.isTextBased()) return explicitLogChannel;

  const { GuildSettings } = client.db.models;
  const settings = await GuildSettings.findOne({ where: { guildId: interaction.guildId } });
  const logChannelId = settings?.voiceLogChannelId || settings?.auditLogChannelId || settings?.modLogChannelId;
  if (!logChannelId) return null;

  return interaction.guild.channels.cache.get(logChannelId)
    || await client.channels.fetch(logChannelId).catch(() => null);
}

async function sendVoiceAiStopLog({ interaction, auditChannel, stoppedChannelId, session }) {
  if (!auditChannel?.isTextBased()) {
    return { logged: false, reason: 'No valid log channel is configured.' };
  }

  const permissions = auditChannel.permissionsFor(interaction.guild.members.me);
  const canSend = permissions?.has(PermissionFlagsBits.ViewChannel)
    && permissions?.has(PermissionFlagsBits.SendMessages)
    && permissions?.has(PermissionFlagsBits.EmbedLinks);
  if (!canSend) {
    return { logged: false, reason: `I cannot send embeds in ${auditChannel}.` };
  }

  const startedBy = session?.startedBy ? `<@${session.startedBy}>` : 'Unknown';
  const listenedUser = session?.listenedUserId ? `<@${session.listenedUserId}>` : 'Unknown';
  const startedAt = session?.startedAt ? `<t:${Math.floor(session.startedAt / 1000)}:R>` : 'Unknown';
  const duration = session?.startedAt ? formatSessionDuration(Date.now() - session.startedAt) : 'Unknown';
  const stoppedRoom = stoppedChannelId ? `<#${stoppedChannelId}>` : 'Unknown';
  const transcriptLines = session?.transcript?.slice(-10).map(t => `\`[<t:${Math.floor(t.time/1000)}:T>]\` ${t.text}`) || [];
  const transcriptText = transcriptLines.length ? transcriptLines.join('\n').slice(0, 1000) : '_No activity recorded._';

  try {
    await auditChannel.send({
      embeds: [buildEmbed({
        type: 'info',
        title: '🛑 Voice AI Session Stopped',
        description: `**Stopped By:** <@${interaction.user.id}>\n**Voice Room:** ${stoppedRoom}\n**Session User:** ${listenedUser}\n**Session Started By:** ${startedBy}\n**Session Started:** ${startedAt}\n**Session Duration:** ${duration}`,
        fields: [
          { name: '📝 Recent Transcript', value: transcriptText }
        ],
        footer: `Guild: ${interaction.guildId}${session?.transcript?.length > 10 ? ' • Showing last 10 lines' : ''}`,
        timestamp: true,
      })],
    });

    logger.info(`[VoiceAI] Stop log sent in guild ${interaction.guildId} by ${interaction.user.id} for channel ${stoppedChannelId || 'unknown'}`);
    return { logged: true };
  } catch (err) {
    logger.error('[VoiceAI] Failed to send stop log:', err);
    return { logged: false, reason: 'Failed to send the stop log message.' };
  }
}

function formatSessionDuration(durationMs) {
  const totalSeconds = Math.max(1, Math.floor(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];

  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (seconds || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}

export default voice;

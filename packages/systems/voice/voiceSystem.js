// ================================================================
//  AURA BOT v2.0 — TempVoice & Dynamic Voice Topologies Interface
// ================================================================
import { 
  ChannelType, 
  PermissionFlagsBits, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  EmbedBuilder
} from 'discord.js';
import logger from '../../utils/logger.js';

// Rate Limiting & Debouncing Configuration for Dynamic Renaming
const RENAME_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_RENAMES_PER_WINDOW = 2; // Discord API limit: 2 renames per 10 mins
const RENAME_DEBOUNCE_MS = 3000; // Debounce delay for rapid presence updates

// In-memory rate limiting & debouncing tracking maps
export const renameHistory = new Map(); // channelId -> Array<timestamp>
export const debounceTimers = new Map(); // channelId -> Timeout

/**
 * Checks if a channel is within the allowed rename rate limit (max 2 per 10 mins)
 */
export function checkRenameRateLimit(channelId) {
  const now = Date.now();
  const history = renameHistory.get(channelId) || [];
  const validHistory = history.filter(ts => now - ts < RENAME_LIMIT_WINDOW_MS);
  renameHistory.set(channelId, validHistory);
  return validHistory.length < MAX_RENAMES_PER_WINDOW;
}

/**
 * Records a rename timestamp for rate limiting tracking
 */
export function recordRename(channelId) {
  const now = Date.now();
  const history = renameHistory.get(channelId) || [];
  const validHistory = history.filter(ts => now - ts < RENAME_LIMIT_WINDOW_MS);
  validHistory.push(now);
  renameHistory.set(channelId, validHistory);
}

/**
 * Formats channel name based on member Rich Presence activity
 */
export function formatRichPresenceChannelName(member, nameTemplate = "{user}'s Room") {
  if (!member || !member.user) return 'Voice Room';
  const username = member.user.username;
  const presence = member.presence;

  if (!presence || !presence.activities || presence.activities.length === 0) {
    return nameTemplate.replace('{user}', username);
  }

  // Find non-custom activity (e.g. Playing, Streaming, Listening, Watching, Competing)
  const activity = presence.activities.find(a => a.type !== 4) || presence.activities[0];
  if (!activity || !activity.name) {
    return nameTemplate.replace('{user}', username);
  }

  const rawName = activity.name || '';
  const cleanName = rawName.replace(/[^a-zA-Z0-9\s\-_]/g, '').trim().slice(0, 20);

  // ActivityTypes: 0=Playing, 1=Streaming, 2=Listening, 3=Watching, 5=Competing
  switch (activity.type) {
    case 0: // Playing
      return cleanName ? `🎮 ${cleanName} - ${username}'s Room` : `🎮 ${username}'s Room`;
    case 1: { // Streaming
      const streamDetail = activity.details || cleanName || 'Live';
      const cleanStream = streamDetail.replace(/[^a-zA-Z0-9\s\-_]/g, '').trim().slice(0, 20);
      return `🔴 Streaming ${cleanStream} - ${username}'s Room`;
    }
    case 2: { // Listening (e.g. Spotify)
      const listenDetail = cleanName || 'Spotify';
      return `🎵 ${listenDetail} - ${username}'s Room`;
    }
    case 3: // Watching
      return cleanName ? `📺 ${cleanName} - ${username}'s Room` : `📺 Watching - ${username}'s Room`;
    case 5: // Competing
      return cleanName ? `🏆 ${cleanName} - ${username}'s Room` : `🏆 Competing - ${username}'s Room`;
    default:
      return nameTemplate.replace('{user}', username);
  }
}

/**
 * Schedules a debounced & rate-limited rename for a channel
 */
export function scheduleChannelRename(channel, targetName) {
  if (!channel || !targetName || channel.name === targetName) return;

  if (debounceTimers.has(channel.id)) {
    clearTimeout(debounceTimers.get(channel.id));
  }

  const timer = setTimeout(async () => {
    debounceTimers.delete(channel.id);
    if (channel.name === targetName) return;

    if (!checkRenameRateLimit(channel.id)) {
      logger.debug(`[TempVoice] Rate limit hit for renaming channel ${channel.id}. Skipping rename.`);
      return;
    }

    try {
      await channel.setName(targetName);
      recordRename(channel.id);
      logger.info(`[TempVoice] Renamed channel ${channel.id} to "${targetName}"`);
    } catch (err) {
      logger.debug(`[TempVoice] Failed to rename channel ${channel.id}: ${err.message}`);
    }
  }, RENAME_DEBOUNCE_MS);

  debounceTimers.set(channel.id, timer);
}

/**
 * Voice-Text Linking: Grants or revokes permission to linked text channel(s)
 */
export async function syncVoiceTextLinking(client, member, isJoining, settings = null) {
  if (!member || !member.guild) return;
  const { guild } = member;

  try {
    const { GuildSettings } = client.db.models;
    const guildSettings = settings || await GuildSettings.findOne({ where: { guildId: guild.id } });
    if (!guildSettings?.voiceTextLinkedChannelId) return;

    const textChan = await guild.channels.fetch(guildSettings.voiceTextLinkedChannelId).catch(() => null);
    if (!textChan || !textChan.isTextBased()) return;

    if (isJoining) {
      // Grant ViewChannel & SendMessages & ReadMessageHistory
      await textChan.permissionOverwrites.edit(member.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
      }).catch(() => {});
      logger.debug(`[VoiceTextLink] Granted access for ${member.user.tag} in channel ${textChan.id}`);
    } else {
      // Check if member is still in any voice channel in the guild
      const currentVoiceChannel = member.voice?.channelId;
      if (!currentVoiceChannel) {
        // Revoke access / remove overwrite
        await textChan.permissionOverwrites.delete(member.id).catch(() => {});
        logger.debug(`[VoiceTextLink] Revoked access for ${member.user.tag} in channel ${textChan.id}`);
      }
    }
  } catch (err) {
    logger.debug(`[VoiceTextLink] Sync error: ${err.message}`);
  }
}

/**
 * Handle Rich Presence updates for dynamic voice channel renaming
 */
export async function handlePresenceUpdate(client, oldPresence, newPresence) {
  if (!newPresence || !newPresence.guild || !newPresence.member) return;

  const { guild, member } = newPresence;
  const voiceState = member.voice;
  if (!voiceState || !voiceState.channelId) return;

  try {
    const { TempChannel, GuildSettings } = client.db.models;
    const isTemp = await TempChannel.findOne({ where: { channelId: voiceState.channelId, guildId: guild.id } });
    if (!isTemp) return;

    // Only channel owner triggers activity rename
    if (isTemp.ownerId !== member.id) return;

    const settings = await GuildSettings.findOne({ where: { guildId: guild.id } });
    const template = settings?.tempVoiceNameTemplate || "{user}'s Room";
    const targetName = formatRichPresenceChannelName(member, template);

    const channel = voiceState.channel;
    if (channel) {
      scheduleChannelRename(channel, targetName);
    }
  } catch (err) {
    logger.debug(`[TempVoice] Presence update error: ${err.message}`);
  }
}

/**
 * Handle voice state updates for TempVoice logic
 */
export async function handleVoiceUpdate(client, oldState, newState) {
  const guild = newState.guild || oldState.guild;
  const member = newState.member || oldState.member;
  if (!guild || !member) return;

  const { GuildSettings, TempChannel } = client.db.models;

  try {
    const settings = await GuildSettings.findOne({ where: { guildId: guild.id } });
    if (!settings?.tempVoiceEnabled) return;

    const hasJoinedNewChannel = newState.channelId && oldState.channelId !== newState.channelId;
    const hasLeftOldChannel = oldState.channelId && oldState.channelId !== newState.channelId;

    // ─── 1. Join Creator Channel ───────────────────────────────
    if (hasJoinedNewChannel && newState.channelId === settings.tempVoiceCreatorId) {
      const template = settings.tempVoiceNameTemplate || "{user}'s Room";
      const initialName = formatRichPresenceChannelName(member, template);

      const newChannel = await guild.channels.create({
        name: initialName,
        type: ChannelType.GuildVoice,
        parent: settings.tempVoiceCategoryId || newState.channel?.parentId || null,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: member.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.Connect,
              PermissionFlagsBits.Speak,
              PermissionFlagsBits.ManageChannels, 
              PermissionFlagsBits.MoveMembers, 
              PermissionFlagsBits.MuteMembers
            ],
          },
        ],
      });

      // Record rename timestamp on creation so we don't immediately double-rename
      recordRename(newChannel.id);

      // Move member into new channel
      await member.voice.setChannel(newChannel).catch(() => {});

      // Track in DB
      await TempChannel.create({
        guildId: guild.id,
        channelId: newChannel.id,
        ownerId: member.id,
      });

      // Voice-Text Linking: Grant temporary access to linked text channel
      await syncVoiceTextLinking(client, member, true, settings);

      // Send the Pro Interface (Arabic)
      await sendTempVoiceInterface(newChannel, member);
      
      logger.info(`[TempVoice] Created channel ${newChannel.id} for ${member.user.tag}`);
    } else if (hasJoinedNewChannel && newState.channelId) {
      // Joined an existing voice channel -> Sync Voice-Text linking
      await syncVoiceTextLinking(client, member, true, settings);
    }

    // ─── 2. Leave Temp Channel & Cleanup / Ownership Transfer ───
    if (hasLeftOldChannel) {
      const leaveChannel = oldState.channel;

      // Sync Voice-Text linking on leave
      await syncVoiceTextLinking(client, member, false, settings);

      if (leaveChannel) {
        const isTemp = await TempChannel.findOne({ where: { channelId: leaveChannel.id } });
        
        if (isTemp) {
          if (leaveChannel.members.size === 0) {
            // Clean up timers & rate limiter history
            if (debounceTimers.has(leaveChannel.id)) {
              clearTimeout(debounceTimers.get(leaveChannel.id));
              debounceTimers.delete(leaveChannel.id);
            }
            renameHistory.delete(leaveChannel.id);

            await leaveChannel.delete().catch(() => {});
            await isTemp.destroy();
            logger.info(`[TempVoice] Destroyed empty channel ${leaveChannel.id}`);
          } else if (oldState.member?.id === isTemp.ownerId) {
            // Transfer ownership
            const nextOwner = leaveChannel.members.first();
            if (nextOwner) {
              await isTemp.update({ ownerId: nextOwner.id });
              await leaveChannel.permissionOverwrites.edit(nextOwner.id, {
                ManageChannels: true, MoveMembers: true, MuteMembers: true
              }).catch(() => {});

              // Update room name based on new owner's Rich Presence
              const newOwnerName = formatRichPresenceChannelName(nextOwner, settings.tempVoiceNameTemplate || "{user}'s Room");
              scheduleChannelRename(leaveChannel, newOwnerName);

              logger.info(`[TempVoice] Ownership transferred to ${nextOwner.id} for channel ${leaveChannel.id}`);
            }
          }
        }
      }
    }
  } catch (err) {
    logger.debug('[TempVoice]', err.message);
  }
}

/**
 * Sends the Arabic Grid Interface to the TempVoice channel
 */
async function sendTempVoiceInterface(channel, owner) {
  const desc = `يمكنك استخدام **voice/** الأوامر للتحكم في الروم الخاص بك الصوتي المؤقت. المزيد من\nالخيارات متاحة من خلال هذه الواجهة\n\n` +
    `\`💬 موضوع\`  \`🕒 غرفة الانتظار\`  \`🛡️ خصوصية قناتك\`  \`👥 حد عدد الاعضاء\`  \`📝 تغيير اسم\`\n\n` +
    `\`🌍 تغيير منطقة\`  \`📞 طرد\`  \`🔗 دعوة\`  \`➖ عدم الثقة\`  \`➕ الثقة\`\n\n` +
    `\`🗑️ إلغاء\`  \`📈 نقل ملكية\`  \`👑 اخذ الملكية\`  \`🔓 رفع الحظر\`  \`🚫 حظر\`\n\n` +
    `**يمكن استخدام هذه الواجهة بالنقر فوق الأزرار أدناه**`;

  const embed = new EmbedBuilder()
    .setTitle('TempVoice Interface')
    .setDescription(desc)
    .setColor('#2b2d31') // Discord dark theme color to blend the embed
    .setThumbnail(owner.user.displayAvatarURL());

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('tv:rename').setEmoji('📝').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('tv:limit').setEmoji('👥').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('tv:privacy').setEmoji('🛡️').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('tv:waiting').setEmoji('🕒').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('tv:topic').setEmoji('💬').setStyle(ButtonStyle.Secondary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('tv:trust').setEmoji('➕').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('tv:untrust').setEmoji('➖').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('tv:invite').setEmoji('🔗').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('tv:kick').setEmoji('📞').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('tv:region').setEmoji('🌍').setStyle(ButtonStyle.Secondary)
  );

  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('tv:ban').setEmoji('🚫').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('tv:unban').setEmoji('🔓').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('tv:claim').setEmoji('👑').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('tv:transfer').setEmoji('📈').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('tv:cancel').setEmoji('🗑️').setStyle(ButtonStyle.Danger) // Using Danger for cancel to make it distinct
  );

  await channel.send({ content: `<@${owner.id}>`, embeds: [embed], components: [row1, row2, row3] }).catch(() => {});
}

/**
 * Handle Button Interactions for TempVoice
 */
export async function handleTempVoiceInteraction(client, interaction) {
  const { customId, member, channel, guild } = interaction;
  if (!customId.startsWith('tv:')) return;

  const { TempChannel } = client.db.models;
  const temp = await TempChannel.findOne({ where: { channelId: channel.id } });

  if (!temp) return interaction.reply({ content: '❌ هذا الروم ليس روماً مؤقتاً.', ephemeral: true });

  // Ownership Check
  if (temp.ownerId !== member.id && customId !== 'tv:claim') {
    return interaction.reply({ content: '❌ أنت لست مالك هذا الروم.', ephemeral: true });
  }

  const act = customId.split(':')[1];
  
  switch (act) {
    case 'privacy':
      const isLocked = channel.permissionOverwrites.cache?.get?.(guild.id)?.deny?.has?.(PermissionFlagsBits.Connect);
      await channel.permissionOverwrites.edit(guild.id, { Connect: isLocked ? null : false });
      return interaction.reply({ content: isLocked ? '✅ تم فتح الروم للجميع.' : '🔒 تم قفل الروم.', ephemeral: true });
    
    case 'limit':
      return interaction.reply({ content: '🛠️ يرجى استخدام أمر `/voice limit` لتحديد العدد حالياً.', ephemeral: true });
    
    case 'rename':
      return interaction.reply({ content: '🛠️ يرجى استخدام أمر `/voice name` لتغيير اسم الروم.', ephemeral: true });

    case 'cancel':
      await interaction.reply({ content: '🗑️ يتم الآن حذف الروم...', ephemeral: true });
      if (debounceTimers.has(channel.id)) {
        clearTimeout(debounceTimers.get(channel.id));
        debounceTimers.delete(channel.id);
      }
      renameHistory.delete(channel.id);
      await temp.destroy();
      await channel.delete().catch(() => {});
      break;

    case 'claim':
      if (channel.members?.has?.(temp.ownerId) && temp.ownerId !== member.id) {
        return interaction.reply({ content: '❌ المالك الأصلي لا يزال موجوداً في الروم.', ephemeral: true });
      }
      if (temp.ownerId === member.id) {
        return interaction.reply({ content: '👑 أنت المالك الفعلي لهذا الروم.', ephemeral: true });
      }
      await temp.update({ ownerId: member.id });
      return interaction.reply({ content: '👑 تم استلام ملكية الروم بنجاح.', ephemeral: true });

    default:
      return interaction.reply({ content: '🛠️ تم استقبال طلبك، جاري تفعيل هذا الاختيار قريباً.', ephemeral: true });
  }
}

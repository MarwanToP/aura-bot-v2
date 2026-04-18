// ================================================================
//  AURA BOT v2.0 — TempVoice Pro Interface (Arabic Edition)
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

/**
 * Handle voice state updates for TempVoice logic
 */
export async function handleVoiceUpdate(client, oldState, newState) {
  const { guild, member } = newState;
  const { GuildSettings, TempChannel } = client.db.models;

  try {
    const settings = await GuildSettings.findOne({ where: { guildId: guild.id } });
    if (!settings?.tempVoiceEnabled) return;

    // ─── 1. Join Creator Channel ───────────────────────────────
    if (newState.channelId === settings.tempVoiceCreatorId && oldState.channelId !== newState.channelId) {
      const name = settings.tempVoiceNameTemplate.replace('{user}', member.user.username);
      
      const newChannel = await guild.channels.create({
        name,
        type: ChannelType.GuildVoice,
        parent: settings.tempVoiceCategoryId || newState.channel.parentId,
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

      // Move member
      await member.voice.setChannel(newChannel).catch(() => {});

      // Track in DB
      await TempChannel.create({
        guildId: guild.id,
        channelId: newChannel.id,
        ownerId: member.id,
      });

      // 📡 Send the Pro Interface (Arabic)
      await sendTempVoiceInterface(newChannel, member);
      
      logger.info(`[TempVoice] Created channel ${newChannel.id} for ${member.user.tag}`);
    }

    // ─── 2. Leave Temp Channel ──────────────────────────────────
    const leaveChannel = oldState.channel;
    if (leaveChannel && oldState.channelId !== newState.channelId) {
      const isTemp = await TempChannel.findOne({ where: { channelId: leaveChannel.id } });
      
      if (isTemp) {
        if (leaveChannel.members.size === 0) {
          await leaveChannel.delete().catch(() => {});
          await isTemp.destroy();
        } else if (oldState.member.id === isTemp.ownerId) {
          const nextOwner = leaveChannel.members.first();
          if (nextOwner) {
            await isTemp.update({ ownerId: nextOwner.id });
            await leaveChannel.permissionOverwrites.edit(nextOwner.id, {
              ManageChannels: true, MoveMembers: true, MuteMembers: true
            });
            await leaveChannel.send({ 
              content: `👑 تم نقل ملكية الغرفة إلى <@${nextOwner.id}> بسبب مغادرة المالك السابق.` 
            });
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
  const embed = new EmbedBuilder()
    .setTitle('TempVoice Interface')
    .setDescription('يمكنك استخدام /voice للأوامر للتحكم في الروم الخاص بك الصوتي المؤقت. المزيد من الخيارات متاحة من خلال هذه الواجهة بالنقر فوق الأزرار أدناه')
    .setColor('#5865F2')
    .setThumbnail(owner.user.displayAvatarURL());

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('tv:topic').setEmoji('💬').setLabel('موضوع').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('tv:waiting').setEmoji('🕒').setLabel('غرفة الانتظار').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('tv:privacy').setEmoji('🛡️').setLabel('خصوصية قناتك').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('tv:limit').setEmoji('👥').setLabel('حد عدد الاعضاء').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('tv:rename').setEmoji('📝').setLabel('تغيير اسم').setStyle(ButtonStyle.Secondary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('tv:region').setEmoji('🌍').setLabel('تغيير منطقة').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('tv:kick').setEmoji('📞').setLabel('طرد').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('tv:invite').setEmoji('🔗').setLabel('دعوة').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('tv:trust').setEmoji('➕').setLabel('الثقة').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('tv:untrust').setEmoji('➖').setLabel('عدم الثقة').setStyle(ButtonStyle.Secondary)
  );

  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('tv:cancel').setEmoji('🗑️').setLabel('إلغاء').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('tv:transfer').setEmoji('📈').setLabel('نقل ملكية').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('tv:claim').setEmoji('👑').setLabel('اخذ الملكية').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('tv:unban').setEmoji('🔓').setLabel('رفع الحظر').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('tv:ban').setEmoji('🚫').setLabel('حظر').setStyle(ButtonStyle.Secondary)
  );

  await channel.send({ content: `<@${owner.id}>`, embeds: [embed], components: [row1, row2, row3] });
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
      const isLocked = channel.permissionOverwrites.cache.get(guild.id)?.deny.has(PermissionFlagsBits.Connect);
      await channel.permissionOverwrites.edit(guild.id, { Connect: isLocked ? null : false });
      return interaction.reply({ content: isLocked ? '✅ تم فتح الروم للجميع.' : '🔒 تم قفل الروم.', ephemeral: true });
    
    case 'limit':
      // This would normally trigger a modal for input
      return interaction.reply({ content: '🛠️ يرجى استخدام أمر `/voice limit` لتحديد العدد حالياً.', ephemeral: true });

    case 'cancel':
      await channel.delete().catch(() => {});
      await temp.destroy();
      break;

    case 'claim':
      if (channel.members.has(temp.ownerId)) {
        return interaction.reply({ content: '❌ المالك الأصلي لا يزال موجوداً في الروم.', ephemeral: true });
      }
      await temp.update({ ownerId: member.id });
      return interaction.reply({ content: '👑 تم استلام ملكية الروم بنجاح.', ephemeral: true });

    default:
      return interaction.reply({ content: '🛠️ تم استقبال طلبك، جاري تفعيل هذا الاختيار قريباً.', ephemeral: true });
  }
}

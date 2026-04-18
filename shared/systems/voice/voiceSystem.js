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
      // Trigger limit modal or command reply
      return interaction.reply({ content: '🛠️ يرجى استخدام أمر `/voice limit` لتحديد العدد حالياً.', ephemeral: true });
    
    case 'rename':
      // Trigger rename command reply or modal
      return interaction.reply({ content: '🛠️ يرجى استخدام أمر `/voice rename` لتغيير اسم الروم.', ephemeral: true });

    case 'cancel':
      await interaction.reply({ content: '🗑️ يتم الآن حذف الروم...', ephemeral: true });
      await temp.destroy();
      await channel.delete().catch(() => {});
      break;

    case 'claim':
      if (channel.members.has(temp.ownerId) && temp.ownerId !== member.id) {
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

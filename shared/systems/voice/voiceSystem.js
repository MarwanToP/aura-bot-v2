// ================================================================
//  AURA BOT v2.0 — TempVoice System (Phase 2)
// ================================================================
import { ChannelType, PermissionFlagsBits } from 'discord.js';
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
            id: member.id,
            allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MoveMembers, PermissionFlagsBits.MuteMembers],
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

      logger.info(`[TempVoice] Created channel ${newChannel.id} for ${member.user.tag}`);
    }

    // ─── 2. Leave Temp Channel ──────────────────────────────────
    const leaveChannel = oldState.channel;
    if (leaveChannel && oldState.channelId !== newState.channelId) {
      // Check if it was a tracked temp channel
      const isTemp = await TempChannel.findOne({ where: { channelId: leaveChannel.id } });
      
      if (isTemp) {
        // If empty, delete
        if (leaveChannel.members.size === 0) {
          await leaveChannel.delete().catch(() => {});
          await isTemp.destroy();
          logger.info(`[TempVoice] Deleted empty channel ${leaveChannel.id}`);
        } else if (oldState.member.id === isTemp.ownerId) {
          // If owner left, transfer ownership to next member?
          const nextOwner = leaveChannel.members.first();
          if (nextOwner) {
            await isTemp.update({ ownerId: nextOwner.id });
            await leaveChannel.permissionOverwrites.edit(nextOwner.id, {
              ManageChannels: true, MoveMembers: true, MuteMembers: true
            });
            logger.debug(`[TempVoice] Transferred ownership of ${leaveChannel.id} to ${nextOwner.user.tag}`);
          }
        }
      }
    }
  } catch (err) {
    logger.debug('[TempVoice]', err.message);
  }
}

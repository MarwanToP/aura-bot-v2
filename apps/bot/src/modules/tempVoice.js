import { ChannelType } from 'discord.js';

const activeTempChannels = new Set();

/**
 * Handles voice channel join/leave events to create and destroy dynamic voice channels.
 */
export async function handleVoiceStateUpdate(client, oldState, newState) {
  const guild = newState.guild || oldState.guild;
  const member = newState.member || oldState.member;

  // 1. User Joined "Join to Create" Channel
  if (newState.channelId && newState.channel?.name.toLowerCase().includes('create voice')) {
    try {
      const category = newState.channel.parent;

      const newChannel = await guild.channels.create({
        name: `🔊 ${member.displayName.slice(0, 80)}'s Room`,
        type: ChannelType.GuildVoice,
        parent: category || undefined,
        permissionOverwrites: [
          {
            id: member.id,
            allow: ['ManageChannels', 'MoveMembers', 'Connect'],
          },
        ],
      });

      activeTempChannels.add(newChannel.id);
      await member.voice.setChannel(newChannel);
    } catch (error) {
      console.error('❌ Failed to create TempVoice channel:', error);
    }
  }

  // 2. Delete empty TempVoice Channels
  if (oldState.channelId && activeTempChannels.has(oldState.channelId)) {
    const oldChannel = oldState.channel;
    if (oldChannel && oldChannel.members.size === 0) {
      try {
        activeTempChannels.delete(oldChannel.id);
        await oldChannel.delete('TempVoice Channel empty');
      } catch (error) {
        console.error('❌ Failed to delete empty TempVoice channel:', error);
      }
    }
  }
}

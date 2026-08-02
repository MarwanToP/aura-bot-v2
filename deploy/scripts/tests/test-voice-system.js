// ================================================================
//  Unit Test Suite — TempVoice, Rich Presence & Voice-Text Linking
// ================================================================
import assert from 'assert';
import { 
  formatRichPresenceChannelName, 
  checkRenameRateLimit, 
  recordRename, 
  renameHistory,
  debounceTimers,
  syncVoiceTextLinking,
  handleVoiceUpdate,
  handlePresenceUpdate
} from '../../systems/voice/voiceSystem.js';

async function runVoiceSystemTests() {
  console.log('🧪 Starting Voice System Unit Tests...');

  // 1. Test formatRichPresenceChannelName
  console.log('  Testing formatRichPresenceChannelName...');
  
  const mockMemberNoPresence = {
    user: { username: 'Marwan' },
    presence: null
  };
  assert.strictEqual(
    formatRichPresenceChannelName(mockMemberNoPresence, "{user}'s Room"),
    "Marwan's Room"
  );

  const mockMemberPlaying = {
    user: { username: 'Marwan' },
    presence: {
      activities: [{ type: 0, name: 'Valorant' }]
    }
  };
  assert.strictEqual(
    formatRichPresenceChannelName(mockMemberPlaying, "{user}'s Room"),
    "🎮 Valorant - Marwan's Room"
  );

  const mockMemberStreaming = {
    user: { username: 'Marwan' },
    presence: {
      activities: [{ type: 1, name: 'Twitch', details: 'Ranked Grind' }]
    }
  };
  assert.strictEqual(
    formatRichPresenceChannelName(mockMemberStreaming, "{user}'s Room"),
    "🔴 Streaming Ranked Grind - Marwan's Room"
  );

  const mockMemberListening = {
    user: { username: 'Marwan' },
    presence: {
      activities: [{ type: 2, name: 'Spotify' }]
    }
  };
  assert.strictEqual(
    formatRichPresenceChannelName(mockMemberListening, "{user}'s Room"),
    "🎵 Spotify - Marwan's Room"
  );

  const mockMemberWatching = {
    user: { username: 'Marwan' },
    presence: {
      activities: [{ type: 3, name: 'YouTube' }]
    }
  };
  assert.strictEqual(
    formatRichPresenceChannelName(mockMemberWatching, "{user}'s Room"),
    "📺 YouTube - Marwan's Room"
  );

  const mockMemberCompeting = {
    user: { username: 'Marwan' },
    presence: {
      activities: [{ type: 5, name: 'ESL Pro League' }]
    }
  };
  assert.strictEqual(
    formatRichPresenceChannelName(mockMemberCompeting, "{user}'s Room"),
    "🏆 ESL Pro League - Marwan's Room"
  );

  console.log('  ✅ formatRichPresenceChannelName passed');

  // 2. Test Rate Limiter (Max 2 renames per 10 mins)
  console.log('  Testing rate limiter...');
  const testChannelId = 'chan_12345';
  renameHistory.delete(testChannelId);

  // 1st rename
  assert.strictEqual(checkRenameRateLimit(testChannelId), true);
  recordRename(testChannelId);

  // 2nd rename
  assert.strictEqual(checkRenameRateLimit(testChannelId), true);
  recordRename(testChannelId);

  // 3rd rename (should be rate-limited)
  assert.strictEqual(checkRenameRateLimit(testChannelId), false);

  renameHistory.delete(testChannelId);
  console.log('  ✅ Rate limiter passed');

  // 3. Test Voice-Text Linking
  console.log('  Testing Voice-Text Linking sync...');
  let grantedPermissions = null;
  let revokedMemberId = null;

  const mockTextChannel = {
    id: 'text_chan_1',
    isTextBased: () => true,
    permissionOverwrites: {
      edit: async (memberId, perms) => {
        grantedPermissions = { memberId, perms };
      },
      delete: async (memberId) => {
        revokedMemberId = memberId;
      }
    }
  };

  const mockClient = {
    db: {
      models: {
        GuildSettings: {
          findOne: async () => ({ voiceTextLinkedChannelId: 'text_chan_1' }),
        },
        TempChannel: {
          findOne: async () => null,
          create: async () => ({}),
        }
      }
    }
  };

  const mockGuild = {
    id: 'guild_1',
    channels: {
      fetch: async (id) => (id === 'text_chan_1' ? mockTextChannel : null)
    }
  };

  const mockMemberJoin = {
    id: 'user_1',
    user: { tag: 'User1#0001', username: 'User1' },
    guild: mockGuild,
    voice: { channelId: 'voice_1' }
  };

  // Test Join
  await syncVoiceTextLinking(mockClient, mockMemberJoin, true);
  assert.deepStrictEqual(grantedPermissions, {
    memberId: 'user_1',
    perms: { ViewChannel: true, SendMessages: true, ReadMessageHistory: true }
  });

  // Test Leave
  const mockMemberLeave = {
    id: 'user_1',
    user: { tag: 'User1#0001', username: 'User1' },
    guild: mockGuild,
    voice: { channelId: null }
  };
  await syncVoiceTextLinking(mockClient, mockMemberLeave, false);
  assert.strictEqual(revokedMemberId, 'user_1');

  console.log('  ✅ Voice-Text Linking passed');

  // 4. Test Ephemeral Channel Creation and Destruction
  console.log('  Testing Ephemeral Lifecycle (Join Creator & Leave Temp)...');
  let createdChannel = null;
  let deletedChannel = false;
  let tempChannelCreated = null;

  const mockGuildLifecycle = {
    id: 'guild_1',
    channels: {
      create: async (options) => {
        createdChannel = options;
        return {
          id: 'temp_voice_999',
          name: options.name,
          delete: async () => { deletedChannel = true; }
        };
      },
      fetch: async (id) => (id === 'text_chan_1' ? mockTextChannel : null)
    }
  };

  let dbTempChannelStore = null;

  const mockClientLifecycle = {
    db: {
      models: {
        GuildSettings: {
          findOne: async () => ({
            tempVoiceEnabled: true,
            tempVoiceCreatorId: 'creator_chan_1',
            tempVoiceCategoryId: 'category_1',
            tempVoiceNameTemplate: "{user}'s Channel",
            voiceTextLinkedChannelId: 'text_chan_1'
          }),
        },
        TempChannel: {
          create: async (data) => {
            tempChannelCreated = data;
            dbTempChannelStore = { ...data, destroy: async () => { dbTempChannelStore = null; } };
            return dbTempChannelStore;
          },
          findOne: async ({ where }) => {
            if (dbTempChannelStore && dbTempChannelStore.channelId === where.channelId) {
              return dbTempChannelStore;
            }
            return null;
          }
        }
      }
    }
  };

  const mockMemberCreator = {
    id: 'user_creator',
    user: { tag: 'Creator#0001', username: 'Creator', displayAvatarURL: () => '' },
    guild: mockGuildLifecycle,
    presence: { activities: [{ type: 0, name: 'Fortnite' }] },
    voice: {
      setChannel: async (chan) => {}
    }
  };

  const oldState = { channelId: null, guild: mockGuildLifecycle, member: mockMemberCreator };
  const newState = { channelId: 'creator_chan_1', guild: mockGuildLifecycle, member: mockMemberCreator };

  // Trigger Join Creator
  await handleVoiceUpdate(mockClientLifecycle, oldState, newState);

  assert.ok(createdChannel);
  assert.strictEqual(createdChannel.name, "🎮 Fortnite - Creator's Room");
  assert.ok(tempChannelCreated);
  assert.strictEqual(tempChannelCreated.channelId, 'temp_voice_999');

  // Trigger Leave Temp Channel (channel now empty)
  const leaveOldState = {
    channelId: 'temp_voice_999',
    guild: mockGuildLifecycle,
    member: mockMemberCreator,
    channel: {
      id: 'temp_voice_999',
      members: { size: 0 },
      delete: async () => { deletedChannel = true; }
    }
  };
  const leaveNewState = { channelId: null, guild: mockGuildLifecycle, member: mockMemberCreator };

  await handleVoiceUpdate(mockClientLifecycle, leaveOldState, leaveNewState);

  assert.strictEqual(deletedChannel, true);
  assert.strictEqual(dbTempChannelStore, null);

  console.log('  ✅ Ephemeral Lifecycle passed');

  console.log('🎉 All Voice System Unit Tests Passed Cleanly!');
}

runVoiceSystemTests().catch(err => {
  console.error('❌ Voice system unit test failed:', err);
  process.exit(1);
});

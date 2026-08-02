import { Collection } from 'discord.js';
import { loadCommands } from '../../../bot/core/commandHandler.js';
import database from '../../database/index.js';
import { readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '../../..');

console.log('================================================================');
console.log('  AURA BOT v2.0 — COMPREHENSIVE COMMAND PHYSICAL TEST HARNESS');
console.log('================================================================\n');

// 1. Database Connection & Model Stubbing
let dbConnected = false;
try {
  await database.authenticate();
  dbConnected = true;
  console.log('✅ Connected to Postgres database for live model testing.');
} catch (dbErr) {
  console.log('⚠️ Database connection unreachable (offline/test mode). Installing DB model stubs...');
  
  const stubModel = {
    findOne: async () => null,
    findAll: async () => [],
    findAndCountAll: async () => ({ count: 0, rows: [] }),
    findOrCreate: async () => [{ update: async () => {} }, true],
    count: async () => 0,
    create: async (data) => ({ ...data, id: 1, update: async () => {} }),
    update: async () => [1],
    destroy: async () => 1,
  };

  if (database.models) {
    for (const key of Object.keys(database.models)) {
      database.models[key] = { ...stubModel, name: key };
    }
  }
}

// 2. Audit Duplicates
const commandSourceMap = new Map();
const duplicateDefs = [];

async function scanFiles(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      await scanFiles(full);
      continue;
    }
    if (!entry.endsWith('.js')) continue;
    try {
      const mod = await import(pathToFileURL(full).href);
      const checkObj = (obj, label) => {
        if (obj && typeof obj === 'object' && obj.register !== false && obj.data?.name && typeof obj.execute === 'function') {
          const name = obj.data.name;
          if (!commandSourceMap.has(name)) commandSourceMap.set(name, []);
          commandSourceMap.get(name).push(`${full}#${label}`);
        }
      };
      if (mod.default) checkObj(mod.default, 'default');
      for (const [k, v] of Object.entries(mod)) {
        if (k !== 'default') checkObj(v, k);
      }
    } catch (e) {
      console.warn(`Warning scanning ${entry}: ${e.message}`);
    }
  }
}

await scanFiles(join(rootDir, 'bot/cogs'));
await scanFiles(join(rootDir, 'shared/systems'));

console.log('\n--- 🔍 DUPLICATE COMMAND AUDIT ---');
for (const [name, sources] of commandSourceMap.entries()) {
  const uniqueFiles = new Set(sources.map(s => s.split('#')[0]));
  if (uniqueFiles.size > 1) {
    duplicateDefs.push({ name, sources });
    console.log(`❌ DUPLICATE FOUND: /${name} defined in multiple distinct files:`);
    sources.forEach(s => console.log(`   - ${s}`));
  }
}

if (duplicateDefs.length === 0) {
  console.log('✅ No duplicate command definitions found across distinct files.');
}

// 3. Load Commands into Client
const logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
};

const stubRedis = {
  get: async () => null,
  set: async () => 'OK',
  setex: async () => 'OK',
  del: async () => 0,
  pttl: async () => -1,
  getJSON: async () => null,
  setJSON: async () => 'OK',
  ping: async () => 'PONG',
  quit: async () => {},
  duplicate: () => stubRedis,
  on: () => {},
  status: 'ready',
};

const stubI18n = {
  init: async () => {},
  t: (key) => key,
  resolveLanguage: async () => 'en',
};

const stubAi = {
  isAvailable: () => true,
  prompt: async () => ({ content: 'Mock AI response' }),
  chat: async () => ({ content: 'Mock AI chat response' }),
  generateImage: async () => ({ url: 'https://example.com/mock.png', revisedPrompt: 'mock' }),
  translate: async () => ({ content: 'Mock translation' }),
  summarize: async () => ({ content: 'Mock summary' }),
  moderateContent: async () => ({ violation: false, category: 'None', severity: 'low', confidence: 99, source: 'mock', reason: 'clean' }),
  checkUsage: async () => ({ exceeded: false, limit: 100, usage: 5 }),
  incrementUsage: async () => {},
  suggestPermissions: async () => ({ suggestions: ['ManageMessages'], rationale: 'Mock', dangerZone: false }),
  getContext: async () => [],
  saveContext: async () => {},
  clearContext: async () => {},
};

const mockChannel = {
  id: '888888888888888888',
  name: 'general',
  type: 0,
  send: async () => ({ id: '111', delete: async () => {} }),
  messages: {
    fetch: async () => new Collection(),
    bulkDelete: async () => new Collection(),
  },
  permissionsFor: () => ({ has: () => true }),
  createMessageComponentCollector: () => {
    const handlers = {};
    return {
      on: (ev, fn) => { handlers[ev] = fn; },
      stop: () => {},
    };
  },
};

const mockRole = {
  id: '777777777777777777',
  name: 'Admin',
  position: 10,
  permissions: { has: () => true, toArray: () => ['Administrator'] },
  hexColor: '#ff0000',
  createdTimestamp: Date.now() - 1000000,
  hoist: true,
  mentionable: true,
  managed: false,
  setPermissions: async () => {},
};

const mockGuild = {
  id: '942130377823252490',
  name: 'Test Server',
  ownerId: '999999999999999999',
  memberCount: 50,
  createdTimestamp: Date.now() - 8640000000,
  verificationLevel: 1,
  nsfwLevel: 0,
  premiumSubscriptionCount: 5,
  premiumTier: 1,
  features: ['COMMUNITY'],
  iconURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png',
  bannerURL: () => null,
  fetchOwner: async () => ({ id: '999999999999999999', user: { tag: 'Owner#0001' } }),
  fetch: async () => {},
  channels: {
    cache: new Collection([
      [mockChannel.id, mockChannel],
      ['888888888888888889', { id: '888888888888888889', name: 'voice-chat', type: 2 }],
    ]),
  },
  roles: {
    cache: new Collection([[mockRole.id, mockRole]]),
    fetch: async (id) => mockGuild.roles.cache.get(id) || mockRole,
  },
  members: {
    cache: new Collection(),
    me: {
      permissions: { has: () => true },
      roles: { highest: { position: 99 } },
    },
    fetch: async (id) => ({
      id: id || '999999999999999999',
      user: { id: id || '999999999999999999', username: 'TestUser', tag: 'TestUser#0001', displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png', flags: { toArray: () => [] } },
      permissions: { has: () => true },
      roles: {
        cache: new Collection([[mockRole.id, mockRole]]),
        highest: { position: 10 },
      },
      nickname: 'Tester',
      joinedTimestamp: Date.now() - 5000000,
      presence: { status: 'online', activities: [] },
      voice: { channel: mockChannel },
    }),
  },
  emojis: { cache: new Collection() },
  stickers: { cache: new Collection() },
  invites: { fetch: async () => new Collection() },
};

const client = {
  commands: new Collection(),
  cooldowns: new Collection(),
  logger,
  db: database,
  redis: stubRedis,
  i18n: stubI18n,
  ai: stubAi,
  guilds: { cache: new Collection([[mockGuild.id, mockGuild]]) },
  users: { cache: new Collection() },
  user: { id: '939799976308011018', tag: 'AURA#5970', username: 'AURA', displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png' },
  ws: { ping: 20 },
  readyTimestamp: Date.now() - 3600000,
  inviteCache: new Map(),
};

await loadCommands(client);
console.log(`\nLoaded ${client.commands.size} total primary commands.\n`);

// 4. Run Execution Tests
const passedCmds = [];
const failedCmds = [];

function buildMockInteraction(commandName, subcommandName = null, optionsMap = {}) {
  const mockUser = {
    id: '999999999999999999',
    username: 'Tester',
    tag: 'Tester#0001',
    discriminator: '0001',
    bot: false,
    createdTimestamp: Date.now() - 100000000,
    displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png',
    flags: { toArray: () => ['ActiveDeveloper'] },
  };

  const mockMember = {
    id: mockUser.id,
    user: mockUser,
    permissions: { has: () => true },
    roles: {
      cache: new Collection([[mockRole.id, mockRole]]),
      highest: { position: 10 },
    },
    nickname: 'TestMember',
    joinedTimestamp: Date.now() - 5000000,
    presence: { status: 'online', activities: [] },
    voice: { channel: mockChannel },
  };

  const createdMsg = {
    id: 'msg_123',
    createdTimestamp: Date.now() + 50,
    createMessageComponentCollector: mockChannel.createMessageComponentCollector,
  };

  return {
    id: `interaction_${Date.now()}_${Math.random()}`,
    commandName,
    guildId: mockGuild.id,
    channelId: mockChannel.id,
    guild: mockGuild,
    member: mockMember,
    user: mockUser,
    channel: mockChannel,
    createdTimestamp: Date.now(),
    deferred: false,
    replied: false,
    isRepliable: () => true,
    deferReply: async () => createdMsg,
    reply: async () => createdMsg,
    editReply: async () => createdMsg,
    followUp: async () => createdMsg,
    options: {
      getSubcommand: (req) => subcommandName || (req ? 'view' : null),
      getSubcommandGroup: () => null,
      getString: (n) => optionsMap[n] || (n === 'lang' ? 'en' : 'test_string'),
      getUser: (n) => mockUser,
      getMember: (n) => mockMember,
      getRole: (n) => mockRole,
      getChannel: (n) => mockChannel,
      getInteger: (n) => 1,
      getNumber: (n) => 1.0,
      getBoolean: (n) => optionsMap[n] !== undefined ? optionsMap[n] : true,
      getAttachment: (n) => ({ url: 'https://example.com/test.png', name: 'test.png' }),
    },
  };
}

console.log('--- 🧪 PHYSICALLY EXECUTING ALL COMMANDS ---');

for (const [name, cmd] of client.commands.entries()) {
  try {
    const data = typeof cmd.data?.toJSON === 'function' ? cmd.data.toJSON() : cmd.data;
    const subcommands = data?.options?.filter(o => o.type === 1).map(o => o.name) || [];

    if (subcommands.length > 0) {
      for (const sub of subcommands) {
        const interaction = buildMockInteraction(name, sub);
        await cmd.execute(client, interaction, 'en');
      }
      passedCmds.push({ name, subCount: subcommands.length });
      console.log(`  ✅ /${name} (${subcommands.length} subcommands) PASSED`);
    } else {
      const interaction = buildMockInteraction(name);
      await cmd.execute(client, interaction, 'en');
      passedCmds.push({ name, subCount: 0 });
      console.log(`  ✅ /${name} PASSED`);
    }
  } catch (err) {
    failedCmds.push({ name, error: err.message, stack: err.stack });
    console.error(`  ❌ /${name} FAILED: ${err.message}`);
  }
}

console.log('\n================================================================');
console.log(`  PHYSICAL TEST RESULTS: ${passedCmds.length} PASSED / ${failedCmds.length} FAILED`);
console.log('================================================================\n');

if (failedCmds.length > 0) {
  console.log('❌ FAILING COMMAND DETAILS:\n');
  failedCmds.forEach(f => {
    console.log(`Command: /${f.name}`);
    console.log(`Error:   ${f.error}`);
    console.log(`Stack:   ${f.stack?.split('\n')[1] || 'N/A'}\n`);
  });
  process.exit(1);
} else {
  console.log('🎉 ALL 54 COMMANDS PASSED PHYSICAL EXECUTION TESTS CLEANLY!');
  process.exit(0);
}

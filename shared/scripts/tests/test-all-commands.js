// ================================================================
//  AURA BOT v2.0 — ALL-COMMAND EXECUTION TEST HARNESS
//  Executes every loaded command (and every subcommand path) with
//  realistic mocks. No Discord/DB/Redis connection required.
//
//  Usage:  node shared/scripts/tests/test-all-commands.js [--only <name>]
//  Exit:   0 = all passed, 1 = failures found
// ================================================================
import { Collection } from 'discord.js';
import { loadCommands } from '../../../bot/core/commandHandler.js';

const args = process.argv.slice(2);
const onlyIdx = args.indexOf('--only');
const onlyName = onlyIdx !== -1 ? args[onlyIdx + 1] : null;

const SNOWFLAKE = '939799976308011018';
const GUILD_ID = '900000000000000001';
const CHANNEL_ID = '900000000000000002';
const USER_ID = '900000000000000003';
const ROLE_ID = '900000000000000004';

// ── Silent logger ───────────────────────────────────────────────
const silentLogger = { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} };

// ── Generic DB row factory ──────────────────────────────────────
function makeRow(extra = {}) {
  const row = {
    id: 1, caseId: 1,
    guildId: GUILD_ID, userId: USER_ID, moderatorId: USER_ID, ownerId: USER_ID, inviterId: USER_ID,
    channelId: CHANNEL_ID, messageId: SNOWFLAKE, roleId: ROLE_ID,
    balance: 1_000_000, bank: 0, xp: 500, level: 3, streak: 1, reputation: 5,
    enabled: true, active: true, isOnDuty: false, left: false, fake: false,
    reason: 'test reason', type: 'warn', content: 'test content', status: 'pending',
    trigger: 'hello', triggerType: 'contains', response: 'world', cooldown: 0, useAI: false,
    upvotes: 0, downvotes: 0, runCount: 0, interval: 300,
    day: 15, month: 6, year: 2000,
    totalDutyTime: 3600, messagesSent: 10, ticketsHandled: 2, lastDutyStart: new Date(),
    nextSendAt: new Date(Date.now() + 60_000), expiresAt: null, createdAt: new Date(), updatedAt: new Date(),
    name: 'test', label: 'Test', emoji: '⭐', price: 100, stock: -1,
    premiumTier: 1, language: 'en', prefix: '!',
    // GuildSettings-ish fields commands read
    welcomeEnabled: true, welcomeChannelId: CHANNEL_ID, farewellEnabled: false, farewellChannelId: null,
    levelingEnabled: true, xpMultiplier: 1, levelUpChannelId: CHANNEL_ID,
    antiNukeEnabled: false, aiModEnabled: false, aiChatChannelId: null,
    ticketEnabled: true, ticketCategoryId: CHANNEL_ID, ticketSupportRoles: [], ticketLogChannelId: CHANNEL_ID,
    modLogChannelId: null, auditLogChannelId: null, staffLogChannelId: null, voiceLogChannelId: null,
    autoRoleId: null, inviteTrackEnabled: true, staffRoleIds: [ROLE_ID], statsEnabled: true,
    statsMemberChannelId: CHANNEL_ID, statsOnlineChannelId: null, statsBotChannelId: null,
    suggestionsEnabled: true, suggestionsChannelId: CHANNEL_ID,
    verificationEnabled: true, verificationRoleId: ROLE_ID, verificationChannelId: CHANNEL_ID,
    tempVoiceEnabled: true, tempVoiceCreatorId: CHANNEL_ID, tempVoiceCategoryId: null,
    birthdayEnabled: true, birthdayChannelId: CHANNEL_ID, birthdayRoleId: null, birthdayMessage: null,
    customEmojis: {}, commandBlacklist: [], disabledChannels: [], commandAliases: {},
    questions: [], categories: [], socialAlertsConfig: {}, inviteConfig: {},
    ...extra,
  };
  row.update = async (vals) => { Object.assign(row, vals); return row; };
  row.save = async () => row;
  row.destroy = async () => 1;
  row.increment = async (field, opts) => { if (typeof field === 'string') row[field] = (row[field] || 0) + (opts?.by ?? 1); return row; };
  row.decrement = async (field, opts) => { if (typeof field === 'string') row[field] = (row[field] || 0) - (opts?.by ?? 1); return row; };
  row.reload = async () => row;
  row.toJSON = () => ({ ...row });
  return row;
}

function makeModel(name) {
  return {
    name,
    findOne: async () => makeRow(),
    findAll: async () => [makeRow()],
    findByPk: async () => makeRow(),
    findOrCreate: async (opts) => [makeRow(opts?.defaults || {}), false],
    findAndCountAll: async () => ({ rows: [makeRow()], count: 1 }),
    create: async (vals) => makeRow(vals),
    count: async () => 0,
    sum: async () => 0,
    max: async () => 1,
    update: async () => [1],
    destroy: async () => 1,
    upsert: async () => [makeRow(), true],
    bulkCreate: async (rows) => rows.map((r) => makeRow(r)),
    rawAttributes: {},
  };
}

const modelRegistry = new Map();
const models = new Proxy({}, {
  get(_t, prop) {
    if (typeof prop !== 'string') return undefined;
    if (!modelRegistry.has(prop)) modelRegistry.set(prop, makeModel(prop));
    return modelRegistry.get(prop);
  },
  has: () => true,
});

// ── Redis stub ──────────────────────────────────────────────────
const redisStub = {
  status: 'none',
  get: async () => null, set: async () => 'OK', setex: async () => 'OK',
  del: async () => 0, pttl: async () => -1, ttl: async () => -1, incr: async () => 1, expire: async () => 1,
  getJSON: async () => null, setJSON: async () => 'OK', keys: async () => [], publish: async () => 0,
  sadd: async () => 1, srem: async () => 1, smembers: async () => [], sismember: async () => 0,
  hget: async () => null, hset: async () => 1, hgetall: async () => ({}), zadd: async () => 1,
  zrange: async () => [], zrevrange: async () => [], duplicate() { return this; }, on: () => {}, quit: async () => {},
};

// ── AI stub ─────────────────────────────────────────────────────
const aiStub = {
  isAvailable: () => true,
  prompt: async () => ({ content: 'mock ai response' }),
  chat: async () => ({ content: 'mock ai chat' }),
  translate: async () => ({ content: 'mock translation' }),
  summarize: async () => ({ content: 'mock summary' }),
  generateImage: async () => ({ url: 'https://example.com/img.png', revisedPrompt: 'mock' }),
  moderateContent: async () => ({ violation: false, confidence: 0, severity: 'low', category: null, reason: null, source: 'mock' }),
  suggestPermissions: async () => ({ rationale: 'mock', suggestions: ['SendMessages'], dangerZone: false }),
  checkUsage: async () => ({ exceeded: false, usage: 0, limit: 100 }),
  incrementUsage: async () => {},
  getContext: async () => [], saveContext: async () => {}, clearContext: async () => {},
  generateWelcomeMessage: async () => 'mock welcome',
};

// ── i18n stub ───────────────────────────────────────────────────
const i18nStub = {
  init: async () => {},
  t: (key) => key,
  resolveLanguage: async () => 'en',
};

// ── Discord entity mocks ────────────────────────────────────────
const permsAllow = { has: () => true, toArray: () => ['Administrator'], bitfield: 8n };

function makeMockMessage() {
  const msg = {
    id: SNOWFLAKE,
    createdTimestamp: Date.now(),
    url: `https://discord.com/channels/${GUILD_ID}/${CHANNEL_ID}/${SNOWFLAKE}`,
    author: null, // set later
    edit: async () => msg,
    delete: async () => msg,
    react: async () => ({}),
    reply: async () => msg,
    pin: async () => msg,
    createMessageComponentCollector: () => ({ on: () => {}, stop: () => {}, once: () => {} }),
  };
  return msg;
}

function makeRolesCache(ids = [ROLE_ID]) {
  const coll = new Collection();
  for (const id of ids) coll.set(id, makeMockRole(id));
  return coll;
}

function makeMockRole(id = ROLE_ID) {
  return {
    id, name: 'TestRole', position: 1, color: 0x5865f2, hexColor: '#5865f2',
    managed: false, hoist: false, mentionable: true, editable: true,
    createdTimestamp: Date.now() - 86_400_000,
    permissions: { has: () => false, toArray: () => [], bitfield: 0n, ...{} },
    members: new Collection(),
    setPermissions: async () => {},
    comparePositionTo: () => -1,
  };
}

function makeMockUser(id = USER_ID, bot = false) {
  return {
    id, bot,
    username: 'testuser', tag: 'testuser#0', discriminator: '0', globalName: 'Test User',
    createdTimestamp: Date.now() - 90 * 86_400_000,
    displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png',
    flags: { toArray: () => [] },
    send: async () => makeMockMessage(),
  };
}

function makeMockMember(client, id = USER_ID) {
  const user = makeMockUser(id);
  const rolesCache = makeRolesCache([ROLE_ID]);
  const member = {
    id, user, nickname: null, presence: null,
    joinedTimestamp: Date.now() - 30 * 86_400_000,
    permissions: permsAllow,
    kickable: true, bannable: true, moderatable: true, manageable: true,
    displayAvatarURL: () => user.displayAvatarURL(),
    roles: {
      cache: rolesCache,
      highest: { id: ROLE_ID, position: 5, comparePositionTo: () => 1 },
      add: async () => member,
      remove: async () => member,
    },
    voice: { channel: null }, // assigned after guild exists
    timeout: async () => member,
    kick: async () => member,
    ban: async () => member,
    send: user.send,
  };
  return member;
}

function makeMockGuild(client) {
  const guild = {
    id: GUILD_ID, name: 'Test Guild', ownerId: USER_ID, memberCount: 100,
    premiumTier: 1, premiumSubscriptionCount: 3, verificationLevel: 1, nsfwLevel: 0,
    features: [], createdTimestamp: Date.now() - 365 * 86_400_000,
    iconURL: () => null, bannerURL: () => null,
    fetch: async () => guild,
    fetchOwner: async () => ({ id: USER_ID }),
  };

  const botMember = makeMockMember(client, 'bot-id');
  botMember.roles.highest = { id: 'botrole', position: 10, comparePositionTo: () => 1 };
  guild.members = {
    me: botMember,
    cache: new Collection(),
    fetch: async (id) => (typeof id === 'string' ? makeMockMember(client, id) : new Collection([[USER_ID, makeMockMember(client, USER_ID)]])),
    unban: async () => ({}),
    ban: async () => ({}),
  };
  guild.roles = {
    everyone: { id: GUILD_ID },
    cache: makeRolesCache([ROLE_ID]),
    fetch: async (id) => makeMockRole(id),
  };
  guild.channels = {
    cache: new Collection(),
    create: async (opts) => makeMockTextChannel(guild, String(Date.now()), opts?.name || 'new-channel'),
    fetch: async () => null,
  };
  guild.bans = { fetch: async () => ({ user: makeMockUser('900000000000000099') }) };
  guild.emojis = { cache: new Collection() };
  guild.stickers = { cache: new Collection() };
  guild.invites = { fetch: async () => new Collection() };
  return guild;
}

function makeMockTextChannel(guild, id = CHANNEL_ID, name = 'test-channel') {
  const channel = {
    id, name, type: 0, guild, guildId: guild.id,
    isTextBased: () => true, isDMBased: () => false, isVoiceBased: () => false,
    rateLimitPerUser: 0,
    permissionsFor: () => permsAllow,
    permissionOverwrites: { edit: async () => {}, create: async () => {} },
    send: async () => makeMockMessage(),
    setRateLimitPerUser: async (secs) => { channel.rateLimitPerUser = secs; return channel; },
    setName: async (n) => { channel.name = n; return channel; },
    messages: {
      fetch: async (arg) => {
        if (typeof arg === 'string') { const m = makeMockMessage(); m.author = makeMockUser(); return m; }
        const coll = new Collection();
        for (let i = 0; i < 5; i++) {
          const m = makeMockMessage(); m.id = `msg${i}`; m.author = makeMockUser(`90000000000000001${i}`);
          m.content = `test message ${i}`;
          coll.set(m.id, m);
        }
        return coll;
      },
    },
    bulkDelete: async (msgs) => ({ size: Array.isArray(msgs) ? msgs.length : (msgs?.size ?? 0) }),
  };
  return channel;
}

function makeMockVoiceChannel(guild, id = '900000000000000055') {
  const ch = makeMockTextChannel(guild, id, 'Voice Room');
  ch.type = 2;
  ch.isVoiceBased = () => true;
  ch.members = new Collection();
  ch.userLimit = 0;
  ch.setUserLimit = async () => ch;
  return ch;
}

// ── Option value resolution from command JSON ───────────────────
function defaultForOption(opt) {
  const n = opt.name;
  switch (opt.type) {
    case 3: { // STRING
      if (opt.choices?.length) return opt.choices[0].value;
      if (/duration/.test(n)) return '10m';
      if (/user_?id|message_?id|snowflake|^id$/.test(n)) return SNOWFLAKE;
      if (/emoji/.test(n)) return '⭐';
      if (/actions/.test(n)) return '[]';
      if (/lang/.test(n)) return 'en';
      return 'test value';
    }
    case 4: return Math.max(1, opt.min_value ?? 1); // INTEGER
    case 5: return true;  // BOOLEAN
    case 6: return '@user';   // USER (resolved in getUser/getMember)
    case 7: return '@channel';// CHANNEL
    case 8: return '@role';   // ROLE
    case 10: return opt.min_value ?? 1; // NUMBER
    default: return 'test';
  }
}

function buildOptionValues(opts = []) {
  const map = new Map();
  for (const o of opts) {
    if (o.required || o.type === 3 || o.type === 4) map.set(o.name, defaultForOption(o));
  }
  return map;
}

// ── Mock interaction ────────────────────────────────────────────
function makeInteraction(client, cmdJson, subPath /* {group, sub, options} */) {
  const guild = makeMockGuild(client);
  const channel = makeMockTextChannel(guild);
  guild.channels.cache.set(channel.id, channel);
  const voiceChannel = makeMockVoiceChannel(guild);
  guild.channels.cache.set(voiceChannel.id, voiceChannel);

  const member = makeMockMember(client, USER_ID);
  member.voice.channel = voiceChannel;
  const user = member.user;

  const values = buildOptionValues(subPath?.options || cmdJson.options || []);
  const replies = [];

  const record = (type) => (payload) => {
    replies.push({ type, payload });
    const msg = makeMockMessage();
    msg.author = makeMockUser('bot-id', true);
    return Promise.resolve(msg);
  };

  const interaction = {
    id: SNOWFLAKE,
    commandName: cmdJson.name,
    guild, guildId: GUILD_ID, channel, channelId: CHANNEL_ID,
    member, user,
    createdTimestamp: Date.now(),
    deferred: false, replied: false, ephemeral: false,
    isChatInputCommand: () => true,
    isRepliable: () => true,
    deferReply: async (opts) => { interaction.deferred = true; if (opts?.fetchReply) { const m = makeMockMessage(); m.createdTimestamp = Date.now() + 50; return m; } },
    reply: (p) => { interaction.replied = true; return record('reply')(p); },
    editReply: (p) => record('editReply')(p),
    followUp: (p) => record('followUp')(p),
    deleteReply: async () => {},
    fetchReply: async () => makeMockMessage(),
    options: {
      getSubcommand: (required = true) => {
        if (subPath?.sub) return subPath.sub;
        if (required) throw new Error('No subcommand');
        return null;
      },
      getSubcommandGroup: () => subPath?.group ?? null,
      getString: (n) => (values.has(n) ? String(values.get(n)) : null),
      getInteger: (n) => (values.has(n) ? Number(values.get(n)) : null),
      getNumber: (n) => (values.has(n) ? Number(values.get(n)) : null),
      getBoolean: (n) => (values.has(n) ? Boolean(values.get(n)) : null),
      getUser: (n) => (values.has(n) ? makeMockUser('900000000000000077') : null),
      getMember: (n) => (values.has(n) ? makeMockMember(client, '900000000000000077') : null),
      getChannel: (n) => {
        if (!values.has(n)) return null;
        if (/voice|creator|members|online|bots/.test(n)) return voiceChannel;
        return channel;
      },
      getRole: (n) => (values.has(n) ? makeMockRole('900000000000000066') : null),
      getAttachment: () => null,
      getMentionable: () => null,
    },
  };
  return { interaction, replies };
}

// ── Discover executable paths (subcommands/groups) ──────────────
function extractPaths(cmdJson) {
  const paths = [];
  const opts = cmdJson.options || [];
  const groups = opts.filter((o) => o.type === 2);
  const subs = opts.filter((o) => o.type === 1);
  for (const g of groups) {
    for (const s of g.options || []) {
      if (s.type === 1) paths.push({ group: g.name, sub: s.name, options: s.options || [] });
    }
  }
  for (const s of subs) paths.push({ group: null, sub: s.name, options: s.options || [] });
  if (paths.length === 0) paths.push({ group: null, sub: null, options: opts });
  return paths;
}

// ── Runner ──────────────────────────────────────────────────────
const client = {
  commands: new Collection(),
  cooldowns: new Collection(),
  logger: silentLogger,
  db: { models },
  redis: redisStub,
  i18n: i18nStub,
  ai: aiStub,
  ws: { ping: 42 },
  readyTimestamp: Date.now() - 60_000,
  guilds: { cache: new Collection() },
  users: { cache: new Collection(), fetch: async (id) => makeMockUser(id) },
  channels: { cache: new Collection(), fetch: async () => null },
  user: { id: 'bot-id', tag: 'Aura#0000', displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/1.png' },
  voiceAiSessions: new Map(),
};

// Silence console noise from systems during load/execute
const origWarn = console.warn; const origLog = console.log; const origErr = console.error;
console.warn = () => {}; console.error = () => {};
await loadCommands(client);
console.warn = origWarn; console.error = origErr;

const results = { pass: 0, fail: 0, noreply: 0 };
const failures = [];
const noreplies = [];

const TIMEOUT_MS = 8000;
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`Timed out after ${ms}ms`)), ms))]);

for (const [name, cmd] of [...client.commands.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  if (onlyName && name !== onlyName) continue;
  let json;
  try { json = cmd.data.toJSON(); } catch (e) { failures.push({ name, sub: '-', error: `data.toJSON: ${e.message}` }); results.fail++; continue; }

  for (const path of extractPaths(json)) {
    const label = path.group ? `${path.group} ${path.sub}` : (path.sub || '(root)');
    const { interaction, replies } = makeInteraction(client, json, path);
    try {
      await withTimeout(Promise.resolve(cmd.execute(client, interaction, 'en')), TIMEOUT_MS);
      if (replies.length === 0 && !interaction.deferred) {
        results.noreply++;
        noreplies.push({ name, sub: label });
      } else {
        results.pass++;
      }
    } catch (err) {
      results.fail++;
      failures.push({ name, sub: label, error: (err?.stack?.split('\n').slice(0, 3).join(' | ') || String(err)).slice(0, 300) });
    }
  }
}

console.log('\n' + '═'.repeat(66));
console.log('  AURA BOT v2.0 — ALL-COMMAND EXECUTION TEST');
console.log('═'.repeat(66));
console.log(`  Commands loaded:      ${client.commands.size}`);
console.log(`  Paths passed:         ${results.pass}`);
console.log(`  Paths without reply:  ${results.noreply}`);
console.log(`  Paths FAILED:         ${results.fail}`);

if (noreplies.length) {
  console.log('\n⚠️  NO-REPLY paths (command resolved but never replied):');
  for (const n of noreplies) console.log(`  [${n.name}] ${n.sub}`);
}
if (failures.length) {
  console.log('\n❌ FAILURES:');
  for (const f of failures) console.log(`  [${f.name}] ${f.sub}\n    → ${f.error}`);
}

console.log('\n' + '═'.repeat(66));
if (results.fail === 0) {
  console.log('  ✅ ALL COMMAND PATHS EXECUTED WITHOUT THROWING.');
  process.exit(0);
} else {
  console.log(`  ❌ ${results.fail} path(s) threw errors — fix required.`);
  process.exit(1);
}

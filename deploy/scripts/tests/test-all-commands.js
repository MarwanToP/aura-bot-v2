// ================================================================
//  AURA BOT v2.0 — ALL-COMMAND EXECUTION TEST HARNESS
//  Executes every loaded command (and every subcommand path) with
//  realistic mocks. No Discord/DB/Redis connection required.
//
//  Usage:  node shared/scripts/tests/test-all-commands.js [--only <name>]
//  Exit:   0 = all passed, 1 = failures found
// ================================================================
import { Collection, PermissionsBitField } from 'discord.js';
import { Op, fn, col, literal } from 'sequelize';
import { Transform } from 'node:stream';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import prism from 'prism-media';
import { logger as sharedLogger } from '../../../packages/logger/index.js';
import { loadCommands } from '../../../apps/bot/src/core/commandHandler.js';

const require = createRequire(import.meta.url);

const args = process.argv.slice(2);
const onlyIdx = args.indexOf('--only');
const onlyName = onlyIdx !== -1 ? args[onlyIdx + 1] : null;

const SNOWFLAKE = '939799976308011018';
const GUILD_ID = '900000000000000001';
const CHANNEL_ID = '900000000000000002';
const USER_ID = '900000000000000003';
const ROLE_ID = '900000000000000004';

// ── Local avatar server ──────────────────────────────────────────
// The mocked avatar used to point at Discord's live CDN
// (cdn.discordapp.com/embed/avatars/0.png). That made every command that
// renders or embeds an avatar depend on a real HTTP round-trip: when the CDN
// was slow, the /bank balance path (the only path that decodes an avatar
// into a canvas card) intermittently ran past the harness timeout.
//
// The harness is documented as needing no external connection, so the avatar
// is served from a loopback HTTP server instead. The URL stays a normal
// http(s) URL — Discord's own embed validation rejects anything else — and
// the real fetch → decode → draw path is still exercised, only locally.
const AVATAR_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
let mockAvatarUrl = 'http://127.0.0.1/avatar.png';
const avatarServer = createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': AVATAR_PNG.length });
  res.end(AVATAR_PNG);
});
await new Promise((resolve) => {
  // If the loopback socket cannot be opened the harness keeps the default
  // URL — the avatar then fails to load and the card falls back to its
  // monogram, which is still a valid, passing path.
  avatarServer.once('error', () => resolve());
  avatarServer.listen(0, '127.0.0.1', resolve);
});
const avatarAddress = avatarServer.address();
if (avatarAddress) mockAvatarUrl = `http://127.0.0.1:${avatarAddress.port}/avatar.png`;

// ── Console preservation (used by load + capture fallbacks) ─────
const origConsole = { warn: console.warn, log: console.log, error: console.error };

// ── Error / warning capture ─────────────────────────────────────
// Commands routinely catch their own exceptions and only log them (logger.error /
// console.error), so a path could log a real internal error and this harness would
// still report "0 failed". Any such log emitted while a path executes is attributed
// to that path and reported in a dedicated section; it counts as a failure unless
// the exact message is whitelisted below.
//
// ERROR_WHITELIST is intentionally minimal — every entry hides a real error from the
// exit code, so only add one with a concrete, tracked fix.
const ERROR_WHITELIST = [
  // Empty by design. The former mod.js Prisma entry was removed after mod.js was
  // migrated to the shared case system (createCase/sendModLog) — all 142 paths now
  // run with zero logged errors. Real database failures must never be whitelisted.
];

const loggedErrors = new Map(); // `${command}|${path}` -> { name, sub, message, count, whitelisted, reason }
let currentPath = null; // the path currently handed to execute()

function matchWhitelist(message) {
  return ERROR_WHITELIST.find((w) => (w.match instanceof RegExp ? w.match.test(message) : message.includes(w.match)));
}

function formatLogArgs(logArgs) {
  return logArgs
    .map((a) => {
      if (a instanceof Error) return a.message;
      if (typeof a === 'string') return a;
      if (a === null || a === undefined || typeof a !== 'object') return String(a);
      try { return JSON.stringify(a); } catch { return String(a); }
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300);
}

function captureError(source, logArgs, fallback) {
  const message = formatLogArgs(logArgs);
  if (!message) return;
  // Node's own warning printer routes through console.error; those prints are captured
  // via process.on('warning') and must not be attributed to whichever path happens to
  // be running when the async print lands. Keep them visible on stderr as before.
  if (message.startsWith(`(node:${process.pid})`)) { fallback(...logArgs); return; }
  if (!currentPath) { fallback(...logArgs); return; } // outside a command path — keep original visibility
  const key = `${currentPath.name}|${currentPath.sub}`;
  const existing = loggedErrors.get(key);
  if (existing) { existing.count++; return; }
  const whitelisted = matchWhitelist(message);
  loggedErrors.set(key, {
    name: currentPath.name,
    sub: currentPath.sub,
    message: `[${source}] ${message}`,
    count: 1,
    whitelisted: Boolean(whitelisted),
    reason: whitelisted?.reason,
  });
}

// Deprecation / process warnings — reported, never fatal.
// process.on('warning') is the canonical listener, but Node dispatches it on nextTick
// and this harness runs a microtask-heavy loop that can reach process.exit() before the
// queue drains — so warnings are also recorded synchronously at emitWarning() call time.
const processWarnings = [];
const seenWarningKeys = new Set();
function recordWarning(w) {
  const key = `${w?.code || ''}|${w?.message || ''}`;
  if (seenWarningKeys.has(key)) return;
  seenWarningKeys.add(key);
  processWarnings.push(w);
}
process.on('warning', recordWarning);
const origEmitWarning = process.emitWarning.bind(process);
process.emitWarning = (warning, ...rest) => {
  try {
    const opts = rest[0];
    const type = typeof opts === 'string' ? opts : (opts && typeof opts === 'object' ? opts.type : undefined);
    recordWarning({
      name: warning instanceof Error ? warning.name : (type || 'Warning'),
      code: opts && typeof opts === 'object' ? opts.code : (typeof rest[1] === 'string' ? rest[1] : undefined),
      message: warning instanceof Error ? warning.message : String(warning),
    });
  } catch { /* capture must never break the run */ }
  return origEmitWarning(warning, ...rest);
};

// ── Logger stub ─────────────────────────────────────────────────
// Info/warn/debug stay silent; errors are captured and attributed to the running path.
const silentLogger = {
  info: () => {}, warn: () => {}, debug: () => {},
  error: (...logArgs) => captureError('client.logger', logArgs, origConsole.error),
};

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
    increment: async () => [1],
    decrement: async () => [1],
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

// The mocked bot's own permission set. Commands declare `botPermissions`
// (the permissions the BOT needs) and the shared gate
// (packages/utils/permissions.js) resolves them with
// `guild.members.me.permissionsIn(channel)` — so the mock member has to
// answer that call with a real bitfield. The mocked bot holds every
// permission so no command path is blocked by a missing bot permission.
const BOT_PERMISSIONS = new PermissionsBitField(PermissionsBitField.All);

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
    displayAvatarURL: () => mockAvatarUrl,
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
    // The bot's own permissions in a given channel — the shared permission gate
    // resolves `botPermissions` through this. The mocked bot holds them all.
    permissionsIn: () => BOT_PERMISSIONS,
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

// Minimal stub for `guild.voiceAdapterCreator` (present on every real discord.js guild).
// @discordjs/voice requires the adapter returned by it to expose `sendPayload` (join
// handshake) and `destroy` (connection teardown) — no gateway/websocket is involved.
function makeVoiceAdapterCreator() {
  return function voiceAdapterCreator() {
    const adapter = {
      sendPayload: () => true, // truthy = payload accepted, connection stays in "signalling"
      destroy: () => {},
      on: () => adapter,
      once: () => adapter,
      subscribe: () => ({ on: () => {}, destroy: () => {} }),
    };
    return adapter;
  };
}

function makeMockGuild(client) {
  const guild = {
    id: GUILD_ID, name: 'Test Guild', ownerId: USER_ID, memberCount: 100,
    premiumTier: 1, premiumSubscriptionCount: 3, verificationLevel: 1, nsfwLevel: 0,
    features: [], createdTimestamp: Date.now() - 365 * 86_400_000,
    iconURL: () => null, bannerURL: () => null,
    fetch: async () => guild,
    fetchOwner: async () => ({ id: USER_ID }),
    voiceAdapterCreator: makeVoiceAdapterCreator(),
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
  // Audit log (Discord API) — lets /auditlog exercise its real rendering path
  // instead of the "audit log unavailable" fallback.
  guild.fetchAuditLogs = async ({ limit = 10 } = {}) => {
    const entries = [];
    for (let i = 0; i < Math.min(Number(limit) || 10, 25); i++) {
      entries.push({
        id: String(1000 + i),
        action: 12, // AuditLogEvent.MemberBanAdd
        actionType: 'MemberBanAdd',
        targetId: '900000000000000099',
        target: makeMockUser('900000000000000099'),
        executorId: USER_ID,
        executor: makeMockUser(USER_ID),
        createdTimestamp: Date.now() - (i + 1) * 60_000,
        reason: 'test entry',
      });
    }
    return { entries: new Collection(entries.map((e, i) => [e.id, e])) };
  };
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
      // Social-alert identifiers are validated server-side (SSRF guard):
      // a generic "test value" contains a space and is not a valid handle.
      if (n === 'identifier') return 'testuser';
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
    client, // real interactions always expose the client — systems read interaction.client.db
    guild, guildId: GUILD_ID, channel, channelId: CHANNEL_ID,
    member, user,
    createdTimestamp: Date.now(),
    deferred: false, replied: false, ephemeral: false,
    isChatInputCommand: () => true,
    isRepliable: () => true,
    deferReply: async (opts) => { interaction.deferred = true; if (opts?.fetchReply) { const m = makeMockMessage(); m.createdTimestamp = Date.now() + 50; return m; } },
    showModal: (modal) => record('showModal')(modal),
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
// The `/voice ai` path builds a prism-media Opus decoder. No native Opus backend
// (@discordjs/opus, node-opus, opusscript) is installed in the test environment, so
// substitute a pass-through decoder — the mock receiver never delivers audio packets,
// decoding fidelity is irrelevant here.
class StubOpusDecoder extends Transform {
  _transform(_chunk, _encoding, callback) { callback(); }
}
const hasOpusBackend = ['@discordjs/opus', 'node-opus', 'opusscript']
  .some((mod) => { try { require.resolve(mod); return true; } catch { return false; } });
if (!hasOpusBackend) prism.opus.Decoder = StubOpusDecoder;

const client = {
  commands: new Collection(),
  cooldowns: new Collection(),
  logger: silentLogger,
  // Mirror the real client.db (the Sequelize instance): models + aggregate helpers.
  db: { models, fn, col, literal, Op, transaction: async (cb) => cb({}) },
  redis: redisStub,
  i18n: i18nStub,
  ai: aiStub,
  ws: { ping: 42 },
  readyTimestamp: Date.now() - 60_000,
  guilds: { cache: new Collection() },
  users: { cache: new Collection(), fetch: async (id) => makeMockUser(id) },
  channels: { cache: new Collection(), fetch: async () => null },
  user: { id: 'bot-id', tag: 'Aura#0000', displayAvatarURL: () => mockAvatarUrl },
  voiceAiSessions: new Map(),
};

// Silence console noise from systems during load
console.warn = () => {}; console.error = () => {};
await loadCommands(client);
console.warn = origConsole.warn; console.error = origConsole.error;

// Capture everything commands log while paths execute. The shared winston logger and
// console.error are the two sinks commands use for swallowed errors, and client.logger
// is instrumented via `silentLogger` above.
const origLoggerError = sharedLogger.error.bind(sharedLogger);
sharedLogger.error = (...logArgs) => captureError('logger', logArgs, origLoggerError);
console.error = (...logArgs) => captureError('console.error', logArgs, origConsole.error);

const results = { pass: 0, fail: 0, noreply: 0 };
const failures = [];
const noreplies = [];

const TIMEOUT_MS = 8000;
// The watchdog timer is cleared once the path settles. Leaving it pending
// would keep one 8s timer alive per path (155 of them), and every one of
// them would fire in the middle of a later path, adding timer-phase work
// exactly where the budget is tightest.
const withTimeout = (p, ms) => {
  let timer;
  const watchdog = new Promise((_, rej) => {
    timer = setTimeout(() => rej(new Error(`Timed out after ${ms}ms`)), ms);
  });
  return Promise.race([p, watchdog]).finally(() => clearTimeout(timer));
};

for (const [name, cmd] of [...client.commands.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  if (onlyName && name !== onlyName) continue;
  let json;
  try { json = cmd.data.toJSON(); } catch (e) { failures.push({ name, sub: '-', error: `data.toJSON: ${e.message}` }); results.fail++; continue; }

  for (const path of extractPaths(json)) {
    const label = path.group ? `${path.group} ${path.sub}` : (path.sub || '(root)');
    const { interaction, replies } = makeInteraction(client, json, path);
    currentPath = { name, sub: label };
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
    } finally {
      currentPath = null;
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
const loggedErrorList = [...loggedErrors.values()];
const fatalLoggedErrors = loggedErrorList.filter((e) => !e.whitelisted);
const whitelistedCount = loggedErrorList.length - fatalLoggedErrors.length;
console.log(`  Paths with logged errors: ${loggedErrorList.length}${whitelistedCount ? ` (whitelisted: ${whitelistedCount})` : ''}`);

if (noreplies.length) {
  console.log('\n⚠️  NO-REPLY paths (command resolved but never replied):');
  for (const n of noreplies) console.log(`  [${n.name}] ${n.sub}`);
}
if (failures.length) {
  console.log('\n❌ FAILURES:');
  for (const f of failures) console.log(`  [${f.name}] ${f.sub}\n    → ${f.error}`);
}
if (loggedErrorList.length) {
  console.log('\n⚠️  PATHS WITH LOGGED ERRORS (swallowed by command code — fatal unless whitelisted):');
  for (const e of loggedErrorList) {
    console.log(`  [${e.name}] ${e.sub}${e.whitelisted ? '  (whitelisted)' : ''}\n    → ${e.message}${e.count > 1 ? `  (${e.count}x)` : ''}`);
    if (e.whitelisted) console.log(`    ℹ️  ${e.reason}`);
  }
}

const deprecations = [...new Map(
  processWarnings
    .filter((w) => w?.name === 'DeprecationWarning')
    .map((w) => [`${w.code || ''}|${w.message}`, w]),
).values()];
if (deprecations.length) {
  console.log('\n⚠️  DEPRECATION WARNINGS (non-fatal):');
  for (const w of deprecations) console.log(`  ${w.name}${w.code ? ` [${w.code}]` : ''}: ${w.message}`);
}

console.log('\n' + '═'.repeat(66));
if (results.fail === 0 && fatalLoggedErrors.length === 0) {
  console.log('  ✅ ALL COMMAND PATHS EXECUTED WITHOUT THROWING.');
  if (whitelistedCount) console.log(`  ℹ️  ${whitelistedCount} whitelisted logged-error path(s) — see section above.`);
  process.exit(0);
} else {
  const parts = [];
  if (results.fail) parts.push(`${results.fail} path(s) threw errors`);
  if (fatalLoggedErrors.length) parts.push(`${fatalLoggedErrors.length} path(s) logged errors`);
  console.log(`  ❌ ${parts.join(' + ')} — fix required.`);
  process.exit(1);
}

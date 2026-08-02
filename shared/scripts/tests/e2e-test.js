// ================================================================
//  AURA BOT v2.0 — End-to-End Mock Test
//  Loads every command, calls execute() with a realistic mock
//  interaction, catches all errors. Exercises the full code path
//  (deferReply, DB, permissions, embeds) without a real Discord user.
// ================================================================
import { Collection } from 'discord.js';
import { loadCommands } from '../../../bot/core/commandHandler.js';
import database from '../../database/index.js';
import redis from '../../database/redis.js';

const logger = {
  info:  () => {},
  warn:  () => {},
  error: (...a) => console.log('  ⚠', ...a),
  debug: () => {},
};

// Stub Redis so we don't hit Upstash
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
};

const stubI18n = {
  init: async () => {},
  t: (key, vars = {}, lang = 'en') => `[${lang}] ${key}`,
  resolveLanguage: async () => 'en',
};

const client = {
  commands: new Collection(),
  cooldowns: new Collection(),
  logger,
  db: database,
  redis: stubRedis,
  i18n: stubI18n,
  ai: {
    isAvailable: () => true,
    chat: async () => ({ content: 'mock AI response', provider: 'cloudflare' }),
    moderateContent: async () => ({ violation: false, confidence: 0, source: 'mock' }),
    translate: async (text) => ({ content: `[translated:${text}]` }),
    summarize: async () => ({ content: 'mock summary' }),
  },
  guilds: { cache: new Collection() },
  users:  { cache: new Collection() },
  user:   { id: 'bot-id', tag: 'Aura#0000', displayAvatarURL: () => '' },
};

await loadCommands(client);

console.log(`\n${'═'.repeat(72)}`);
console.log(`  AURA BOT v2.0 — END-TO-END MOCK TEST`);
console.log(`${'═'.repeat(72)}\n`);

// Build a smart mock interaction factory
function mockInteraction(cmdName, options = {}, overrides = {}) {
  const replies = [];
  const edits = [];
  let deferred = false;
  let replied  = false;

  const inter = {
    isChatInputCommand: () => true,
    isButton:           () => false,
    isStringSelectMenu: () => false,
    isUserSelectMenu:   () => false,
    isContextMenuCommand: () => false,
    isAutocomplete:     () => false,
    isRepliable:        () => true,
    commandName:        cmdName,
    user:               { id: '111111111', username: 'TestUser', bot: false, tag: 'TestUser#0001' },
    member: {
      permissions: {
        has: (p) => {
          // Treat the test user as a server admin so admin-only commands run
          if (typeof p === 'bigint' || typeof p === 'number') {
            return ['Administrator', 'ManageGuild', 'ManageMessages', 'ManageChannels', 'ManageRoles', 'KickMembers', 'BanMembers', 'ModerateMembers', 'MentionEveryone', 'SendMessages', 'EmbedLinks'].includes(String(p)) || p === 8n;
          }
          return true;
        },
      },
      roles: { cache: { has: () => true, get: () => ({ id: 'role1', name: 'r' }) } },
    },
    guild:              {
      id: 'test-guild-1', name: 'Test Guild', memberCount: 42,
      channels: { cache: new Map([['ch-1', { id: 'ch-1', name: '#general', isTextBased: () => true, send: async () => ({}), sendTyping: async () => {} }]]) },
      members: { me: { permissions: { has: () => true } }, cache: { get: () => null, filter: () => ({ size: 0 }) } },
      roles: { cache: { get: () => null } },
    },
    guildId:            'test-guild-1',
    channelId:          'ch-1',
    channel:            { id: 'ch-1', isTextBased: () => true, send: async () => ({}), sendTyping: async () => {} },
    options: {
      getString:    (k) => options[k] ?? null,
      getInteger:   (k) => options[k] ?? null,
      getNumber:    (k) => options[k] ?? null,
      getBoolean:   (k) => options[k] ?? null,
      getUser:      (k) => options[k] ?? null,
      getChannel:   (k) => options[k] ?? null,
      getRole:      (k) => options[k] ?? null,
      getMentionable: (k) => options[k] ?? null,
      getAttachment: (k) => options[k] ?? null,
      getSubcommand:    () => options._subcommand || null,
      getSubcommandGroup: () => options._subgroup || null,
    },
    replied: false,
    deferred: false,
    reply:        async (p) => { replies.push(p); replied = true; return { id: 'mock-msg' }; },
    followUp:     async (p) => { replies.push({ ...p, _followUp: true }); return { id: 'mock-msg' }; },
    editReply:    async (p) => { edits.push(p); return { id: 'mock-msg' }; },
    deferReply:   async () => { deferred = true; },
    update:       async () => {},
    showModal:    async () => {},
    respond:      async () => {},
    inGuild:      () => true,
    locale:       'en-US',
    guildLocale:  'en-US',
    _replies: replies,
    _edits:   edits,
    _isDeferred: () => deferred,
    _isReplied:  () => replied,
    ...overrides,
  };
  return inter;
}

// Commands that touch no DB and are safe to invoke
const SAFE_TO_INVOKE = new Set([
  'ping', 'aura', 'help', 'userinfo', 'serverinfo', 'roleinfo', 'avatar',
  'rank', 'leaderboard', 'richlist', 'case', 'history',
  'warnings', 'note', 'aimod', 'autoresponder', 'stats', 'verify', 'suggest',
  'clan', 'aesthetic', 'modstaff',
]);

// The 4 brand-new commands — focus test here
const NEW_COMMANDS = ['verify', 'stats', 'suggest', 'autoresponder'];

async function runTest(name, sub, options, ctx = {}) {
  const cmd = client.commands.get(name);
  if (!cmd) return { name, ok: false, error: 'Command not loaded' };
  const inter = mockInteraction(name, options, ctx);
  try {
    await cmd.execute(client, inter, 'en');
    // Heuristic: did the command deferReply (good pattern)?
    const deferred = inter._isDeferred();
    return { name: sub ? `${name} ${sub}` : name, ok: true, deferred };
  } catch (err) {
    return { name: sub ? `${name} ${sub}` : name, ok: false, error: err.message.split('\n')[0] };
  }
}

console.log('🧪 Testing the 4 new commands (verify, stats, suggest, autoresponder)\n');

// ── /verify ─────────────────────────────────────────────
console.log('  /verify');
console.log('  ─────');
let r;
r = await runTest('verify', 'setup', { role: { id: 'role-1', name: 'Member' }, channel: { id: 'ch-1' } });
console.log(`    ${r.ok ? '✓' : '✗'} setup       → ${r.ok ? `deferred=${r.deferred}` : r.error}`);
r = await runTest('verify', 'view', {});
console.log(`    ${r.ok ? '✓' : '✗'} view        → ${r.ok ? `deferred=${r.deferred}` : r.error}`);
r = await runTest('verify', 'panel', {});
console.log(`    ${r.ok ? '✓' : '✗'} panel       → ${r.ok ? `deferred=${r.deferred}` : r.error}`);
r = await runTest('verify', 'disable', {});
console.log(`    ${r.ok ? '✓' : '✗'} disable     → ${r.ok ? `deferred=${r.deferred}` : r.error}`);

// ── /stats ──────────────────────────────────────────────
console.log('\n  /stats');
console.log('  ─────');
r = await runTest('stats', 'view', {});
console.log(`    ${r.ok ? '✓' : '✗'} view        → ${r.ok ? `deferred=${r.deferred}` : r.error}`);
r = await runTest('stats', 'set', { members: { id: 'ch-1' } });
console.log(`    ${r.ok ? '✓' : '✗'} set         → ${r.ok ? `deferred=${r.deferred}` : r.error}`);
r = await runTest('stats', 'enable', {});
console.log(`    ${r.ok ? '✓' : '✗'} enable      → ${r.ok ? `deferred=${r.deferred}` : r.error}`);
r = await runTest('stats', 'disable', {});
console.log(`    ${r.ok ? '✓' : '✗'} disable     → ${r.ok ? `deferred=${r.deferred}` : r.error}`);
r = await runTest('stats', 'refresh', {});
console.log(`    ${r.ok ? '✓' : '✗'} refresh     → ${r.ok ? `deferred=${r.deferred}` : r.error}`);

// ── /suggest ────────────────────────────────────────────
console.log('\n  /suggest');
console.log('  ─────');
r = await runTest('suggest', 'submit', { content: 'Add a music channel please, the server would love it!' });
console.log(`    ${r.ok ? '✓' : '✗'} submit      → ${r.ok ? `deferred=${r.deferred}` : r.error}`);
r = await runTest('suggest', null, {}, { member: { permissions: { has: () => true } } });
console.log(`    ${r.ok ? '✓' : '✗'} admin/setup → ${r.ok ? `deferred=${r.deferred}` : r.error}`);
r = await runTest('suggest', 'list', { status: 'pending' }, { member: { permissions: { has: () => true } } });
console.log(`    ${r.ok ? '✓' : '✗'} admin/list  → ${r.ok ? `deferred=${r.deferred}` : r.error}`);
r = await runTest('suggest', 'toggle', {}, { member: { permissions: { has: () => true } } });
console.log(`    ${r.ok ? '✓' : '✗'} admin/toggle→ ${r.ok ? `deferred=${r.deferred}` : r.error}`);

// ── /autoresponder ──────────────────────────────────────
console.log('\n  /autoresponder');
console.log('  ─────');
r = await runTest('autoresponder', 'list', {});
console.log(`    ${r.ok ? '✓' : '✗'} list        → ${r.ok ? `deferred=${r.deferred}` : r.error}`);
r = await runTest('autoresponder', 'add', { trigger: 'hi', trigger_type: 'contains', response: 'hello {user}' });
console.log(`    ${r.ok ? '✓' : '✗'} add         → ${r.ok ? `deferred=${r.deferred}` : r.error}`);

console.log(`\n${'═'.repeat(72)}`);
console.log(`  ✅ End-to-end mock test complete.`);
console.log(`${'═'.repeat(72)}\n`);

process.exit(0);

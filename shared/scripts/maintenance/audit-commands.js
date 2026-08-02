// ================================================================
//  AURA BOT v2.0 — Static Command Audit
//  Validates structure, options, JSON. No execution, no Redis spam.
// ================================================================
import { Collection, SlashCommandBuilder } from 'discord.js';
import { loadCommands } from '../../../bot/core/commandHandler.js';
import database from '../../database/index.js';

// Suppress the duplicate-name warn noise so the report stays clean
const originalWarn = console.warn;
console.warn = () => {};

const logger = {
  info:  (...a) => {},
  warn:  (...a) => {},
  error: (...a) => {},
  debug: () => {},
};

// Stub Redis / i18n to avoid hitting Upstash during the audit
const stubRedis = {
  get:    async () => null,
  set:    async () => 'OK',
  setex:  async () => 'OK',
  del:    async () => 0,
  pttl:   async () => -1,
  getJSON: async () => null,
  setJSON: async () => 'OK',
  ping:   async () => 'PONG',
  quit:   async () => {},
  duplicate: () => stubRedis,
  on:      () => {},
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
  ai: { isAvailable: () => true, chat: async () => ({ content: 'mock' }), moderateContent: async () => ({ violation: false, confidence: 0 }) },
  guilds: { cache: new Collection() },
  users:  { cache: new Collection() },
  user:   { id: 'bot-id', tag: 'Aura#0000', displayAvatarURL: () => '' },
};

await loadCommands(client);

// Restore warn
console.warn = originalWarn;

const issues = [];
const warnings = [];

function err(cmd, msg)  { issues.push({ cmd, msg }); }
function warn(cmd, msg) { warnings.push({ cmd, msg }); }

const reservedNames = new Set();
for (const [name, cmd] of client.commands) {
  if (reservedNames.has(name)) warn(name, `Duplicate command name (overwritten by another file)`);
  reservedNames.add(name);

  if (!cmd.data)                              { err(name, `Missing 'data'`); continue; }
  if (typeof cmd.execute !== 'function')      { err(name, `Missing 'execute' function`); continue; }

  let json;
  try {
    json = cmd.data instanceof SlashCommandBuilder
      ? cmd.data.toJSON()
      : (typeof cmd.data.toJSON === 'function' ? cmd.data.toJSON() : null);
    if (!json) { err(name, `data.toJSON missing`); continue; }
  } catch (e) {
    err(name, `data.toJSON threw: ${e.message.split('\n')[0]}`);
    continue;
  }

  if (!json.name || !json.name.match(/^[\w-]{1,32}$/)) {
    err(name, `Invalid command name: '${json.name}'`);
  }
  if (json.name !== name) err(name, `Key name '${name}' != data.name '${json.name}'`);

  if (!json.description) {
    err(name, `Missing description`);
  } else if (json.description.length > 100) {
    err(name, `Description too long: ${json.description.length} chars (>100) — Discord will reject`);
  }

  if (json.options) {
    for (const opt of json.options) {
      if (!opt.name) { err(name, `Option missing name`); continue; }
      if (!opt.description) err(name, `Option '${opt.name}' missing description`);
      else if (opt.description.length > 100) err(name, `Option '${opt.name}' description too long (${opt.description.length})`);

      if (opt.choices) {
        for (const c of opt.choices) {
          if (!c.name || !c.value) err(name, `Option '${opt.name}' has invalid choice: ${JSON.stringify(c)}`);
        }
      }
      if (opt.type === 1 || opt.type === 2) { // SUB_COMMAND or SUB_COMMAND_GROUP
        for (const subOpt of (opt.options || [])) {
          if (!subOpt.description) warn(name, `Subcommand '${opt.name}' option '${subOpt.name}' missing description`);
        }
      }
      // Channel type validation
      if (opt.channel_types && Array.isArray(opt.channel_types)) {
        const validChannelTypes = [0,1,2,3,4,5,6,10,11,12,13,14,15];
        for (const t of opt.channel_types) {
          if (!validChannelTypes.includes(t)) warn(name, `Option '${opt.name}' has unknown channel_type: ${t}`);
        }
      }
    }
  }

  if (cmd.premiumTier !== undefined && (cmd.premiumTier < 0 || cmd.premiumTier > 3)) {
    warn(name, `premiumTier=${cmd.premiumTier} outside 0-3`);
  }
}

// ── Report ──────────────────────────────────────────────────
console.log(`\n${'═'.repeat(64)}`);
console.log(`  AURA BOT v2.0 — STATIC COMMAND AUDIT`);
console.log(`${'═'.repeat(64)}`);
console.log(`  Commands loaded:    ${client.commands.size}`);
console.log(`  Errors:             ${issues.length}`);
console.log(`  Warnings:           ${warnings.length}`);

if (issues.length) {
  console.log(`\n❌ ERRORS (must fix):\n`);
  for (const i of issues) console.log(`  [${i.cmd}] ${i.msg}`);
}
if (warnings.length) {
  console.log(`\n⚠️  WARNINGS (${warnings.length}):\n`);
  const grouped = {};
  for (const w of warnings) (grouped[w.cmd] ??= []).push(w.msg);
  for (const [cmd, msgs] of Object.entries(grouped)) {
    for (const m of msgs) console.log(`  [${cmd}] ${m}`);
  }
}

console.log(`\n${'═'.repeat(64)}`);
if (issues.length === 0) {
  console.log(`  ✅ Structural audit PASSED — no blocking errors.`);
  process.exit(0);
} else {
  console.log(`  ❌ ${issues.length} error(s) must be fixed.`);
  process.exit(1);
}

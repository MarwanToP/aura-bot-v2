// ================================================================
//  AURA BOT v2.0 — LIVE RUNTIME AUDIT (read-only)
//
//  The mock harness (test-all-commands.js) stubs Discord, the database
//  and Redis, so it can never prove that the bot actually works in
//  production. This script talks to the REAL stack and answers the only
//  question that matters:
//
//    "Would a real user typing /command right now get a working command?"
//
//  It checks, in order:
//    1. environment           — presence/length of the required secrets
//    2. gateway login         — real login, identity, guild list
//    3. command set           — loaded with the runtime loader's rules
//    4. permission cross-check— the bot's OWN bitfield vs. every command
//    5. offline checks        — PostgreSQL drift, Redis, AI provider
//    6. registration sync     — global + per-guild slash command state
//    7. summary               — prioritized list of concrete operator fixes
//
//  Usage:  node deploy/scripts/tests/test-live-runtime.js
//  Exit:   0 = healthy
//          1 = at least one real production problem was found
//
//  STRICTLY READ-ONLY: nothing is written to Discord, the database or
//  Redis. Only SELECT / GET requests are issued. Secrets are never
//  printed — every value is scrubbed before it reaches stdout.
// ================================================================
import 'dotenv/config';
import dotenv from 'dotenv';
import { readdirSync, statSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { Client, GatewayIntentBits, Partials, PermissionsBitField } from 'discord.js';
import Redis from 'ioredis';
import { QueryTypes } from 'sequelize';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../../..');
const API = 'https://discord.com/api/v10';
const WIDTH = 96;
const INDENT = '  ';

// The app loads .env from the repository root — do exactly the same so the
// audit behaves identically no matter which directory the operator runs it from.
dotenv.config({ path: join(ROOT, '.env') });

// ── Output helpers ──────────────────────────────────────────────
const out = (line = '') => console.log(line);
const rel = (p) => String(p).replace(/\\/g, '/');
const relTo = (p) => rel(p).replace(rel(ROOT) + '/', '');

function section(title) {
  out('');
  out('─'.repeat(WIDTH));
  out(`  ${title}`);
  out('─'.repeat(WIDTH));
}

function banner(title) {
  out('');
  out('═'.repeat(WIDTH));
  out(`  ${title}`);
  out('═'.repeat(WIDTH));
}

function wrapList(names, indent = INDENT, width = WIDTH) {
  if (!names.length) return;
  let line = indent;
  for (let i = 0; i < names.length; i++) {
    const piece = (i ? ', ' : '') + names[i];
    if (line.length + piece.length > width) {
      out(line);
      line = indent + '  ' + names[i];
    } else {
      line += piece;
    }
  }
  if (line.trim()) out(line);
}

// ── Secret scrubbing ───────────────────────────────────────────
// Any error message coming back from Discord / Postgres / Redis could
// theoretically echo a credential. Nothing reaches stdout unscrubbed.
const SECRETS = [
  process.env.DISCORD_TOKEN,
  process.env.DISCORD_CLIENT_SECRET,
  process.env.DATABASE_URL,
  process.env.REDIS_URL,
  process.env.GEMINI_API_KEY,
  process.env.CLOUDFLARE_API_TOKEN,
  process.env.JWT_SECRET,
].filter(Boolean);

function scrub(value) {
  let text = String(value ?? '');
  for (const secret of SECRETS) {
    if (!secret) continue;
    text = text.split(secret).join('***');
  }
  // Belt and braces: strip anything that looks like inline credentials.
  text = text
    .replace(/(postgres(?:ql)?:\/\/)[^:@/\s]+:[^@\s]+@/gi, '$1***:***@')
    .replace(/(redis(?:s)?:\/\/)[^:@/\s]*:[^@\s]+@/gi, '$1***:***@')
    .replace(/(password=)[^&\s]+/gi, '$1***');
  return text;
}

const print = (s = '') => out(scrub(s));

// Node prints process warnings on stderr, which interleaves with the report.
// Silence the two known-noisy ones (the discord.js 'ready' deprecation and the
// pg SSL-mode notice) and keep every other warning visible.
const NOISE_WARNINGS = [
  /ready event has been renamed/,
  /SECURITY WARNING: The SSL modes/,
];
process.removeAllListeners('warning');
process.on('warning', (w) => {
  const text = `${w.name}: ${w.message}`;
  if (NOISE_WARNINGS.some((re) => re.test(text))) return;
  print(`  [node warning] ${text}`);
});

// ── Shared state ───────────────────────────────────────────────
const state = {
  login: { ok: false, code: null, name: null, message: null, disallowedIntents: false, closeCode: null },
  bot: null,
  guilds: [],
  runtimeCommands: new Map(),
  deployCommands: new Map(),
  loaderAudit: null,
  db: { reachable: false, models: 0, driftModels: [], missingColumns: 0, error: null },
  redis: { ok: false, error: null },
  ai: { available: false, provider: null, error: null },
  registration: { global: null, guilds: [] },
  problems: [],
  warnings: [],
  fixes: [],
};

const problem = (msg) => { state.problems.push(msg); };
const warn = (msg) => { state.warnings.push(msg); };
const fix = (msg) => { state.fixes.push(msg); };

// ── Discord REST helper (read-only GETs) ───────────────────────
async function api(pathname) {
  const res = await fetch(`${API}${pathname}`, {
    headers: { Authorization: `Bot ${process.env.DISCORD_TOKEN}` },
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) {
    const message = typeof data === 'string' ? data : (data?.message || res.statusText);
    const err = new Error(`HTTP ${res.status} ${message}`);
    err.status = res.status;
    err.apiCode = typeof data === 'object' ? data?.code : undefined;
    throw err;
  }
  return data;
}

// ================================================================
//  1. ENVIRONMENT
// ================================================================
function checkEnvironment() {
  section('1. ENVIRONMENT');
  const keys = [
    ['DISCORD_TOKEN', true],
    ['DISCORD_CLIENT_ID', true],
    ['DATABASE_URL', false],
    ['REDIS_URL', false],
  ];
  for (const [key, required] of keys) {
    const value = process.env[key];
    if (!value) {
      print(`${INDENT}${key.padEnd(18)} MISSING${required ? '  (required)' : ''}`);
      problem(`Environment variable ${key} is not set.`);
      continue;
    }
    // Presence + length only. The value itself is never printed.
    const scheme = /^[a-z0-9+.-]+:\/\//i.exec(value)?.[0]?.replace('://', '') ?? '';
    print(`${INDENT}${key.padEnd(18)} present  (length ${String(value.length)}${scheme ? `, scheme ${scheme}` : ''})`);
  }
  print('');
  print(`${INDENT}Node ${process.version} — ${process.platform}/${process.arch}`);
}

// ================================================================
//  2. GATEWAY LOGIN / IDENTITY / GUILDS
// ================================================================
const PRIVILEGED_INTENTS = [
  { label: 'Message Content Intent', key: 'MESSAGE_CONTENT', used: true },
  { label: 'Server Members Intent', key: 'GUILD_MEMBERS', used: true },
  { label: 'Presence Intent', key: 'GUILD_PRESENCES', used: false },
];

function looksLikeDisallowedIntents(err) {
  if (!err) return false;
  const haystack = `${err.code ?? ''} ${err.name ?? ''} ${err.message ?? ''}`.toLowerCase();
  return (
    haystack.includes('disallowed_intent') ||
    haystack.includes('disallowedintents') ||
    haystack.includes('privileged intent') ||
    haystack.includes('not enabled or whitelisted')
  );
}

async function loginToDiscord() {
  section('2. DISCORD GATEWAY LOGIN');

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
  });

  const gatewayErrors = [];
  client.on('error', (err) => {
    gatewayErrors.push(err);
    if (looksLikeDisallowedIntents(err)) state.login.disallowedIntents = true;
  });
  client.on('shardError', (err) => {
    gatewayErrors.push(err);
    if (looksLikeDisallowedIntents(err)) state.login.disallowedIntents = true;
  });
  client.on('shardDisconnect', (event) => {
    if (event?.code === 4014) {
      state.login.disallowedIntents = true;
      state.login.closeCode = 4014;
    }
  });

  const ready = new Promise((resolveReady, rejectReady) => {
    const timer = setTimeout(
      () => rejectReady(new Error('Timed out after 45s waiting for the gateway READY event.')),
      45_000,
    );
    const onReady = () => { clearTimeout(timer); resolveReady(); };
    client.once('ready', onReady);
    client.once('clientReady', onReady);
  });
  ready.catch(() => {}); // never let the readiness timeout crash the process

  if (!process.env.DISCORD_TOKEN) {
    print(`${INDENT}Login: SKIPPED — DISCORD_TOKEN is not set.`);
    problem('Cannot log in to Discord: DISCORD_TOKEN is not set.');
    return client;
  }

  try {
    await client.login(process.env.DISCORD_TOKEN);
    await ready;
    state.login.ok = true;
    print(`${INDENT}Login: OK`);
  } catch (err) {
    state.login.ok = false;
    state.login.code = err?.code ?? null;
    state.login.name = err?.name ?? null;
    state.login.message = err?.message ?? String(err);
    state.login.disallowedIntents = looksLikeDisallowedIntents(err);

    print(`${INDENT}Login: FAILED`);
    print(`${INDENT}  error name    : ${state.login.name ?? '(none)'}`);
    print(`${INDENT}  error code    : ${state.login.code ?? '(none)'}`);
    print(`${INDENT}  error message : ${scrub(state.login.message)}`);
    if (state.login.closeCode) print(`${INDENT}  gateway close : ${state.login.closeCode}`);

    if (state.login.disallowedIntents) {
      print('');
      print(`${INDENT}  ❌ DISALLOWED INTENTS — the gateway closed the connection because a`);
      print(`${INDENT}     privileged intent is not enabled for this application.`);
      print(`${INDENT}     Enable these in the Discord Developer Portal →`);
      print(`${INDENT}     "Bot" → "Privileged Gateway Intents":`);
      for (const intent of PRIVILEGED_INTENTS) {
        print(`${INDENT}       • ${intent.label.padEnd(26)} ${intent.used ? 'REQUIRED by apps/bot/src/index.js' : 'privileged (not requested by the bot)'}`);
      }
      print(`${INDENT}     The bot cannot read message content without Message Content,`);
      print(`${INDENT}     and cannot track joins/leaves without Server Members.`);
      fix('Enable the Message Content and Server Members privileged intents in the Discord Developer Portal (Bot → Privileged Gateway Intents) and restart the bot.');
    } else {
      print('');
      print(`${INDENT}  The bot CANNOT connect to the gateway — every command is dead in production.`);
      fix('Fix the Discord login error above (invalid/expired token, or the bot was removed from the application) before anything else.');
    }
    problem(`Discord gateway login failed: ${state.login.message}`);

    for (const gwErr of gatewayErrors) {
      if (state.login.message) break;
      state.login.message = gwErr?.message ?? String(gwErr);
    }
  }

  // Identity + guilds — from the gateway when we have it, from REST otherwise.
  try {
    const me = state.login.ok && client.user
      ? { id: client.user.id, username: client.user.username, tag: client.user.tag }
      : await api('/users/@me');
    state.bot = me;
    print('');
    print(`${INDENT}Bot identity : ${me.tag ?? `${me.username}#????`} (id ${me.id})`);
  } catch (err) {
    print(`${INDENT}Bot identity : UNAVAILABLE — ${scrub(err?.message ?? err)}`);
    problem(`Could not read the bot identity from the Discord API: ${err?.message ?? err}`);
  }

  try {
    const list = await api('/users/@me/guilds');
    state.guilds = Array.isArray(list) ? list : [];
    print(`${INDENT}Guilds       : ${state.guilds.length}`);
    for (const g of state.guilds) {
      print(`${INDENT}  • ${g.name ?? '(unknown)'} (${g.id})${g.owner ? ' [owner]' : ''}`);
    }
    if (!state.guilds.length) {
      warn('The bot is not a member of any guild — no command can be used.');
      fix('Invite the bot to at least one server: Discord → Server Settings → Invite → add the bot.');
    }
  } catch (err) {
    print(`${INDENT}Guilds       : UNAVAILABLE — ${scrub(err?.message ?? err)}`);
    problem(`Could not list the bot's guilds: ${err?.message ?? err}`);
  }

  if (!state.login.ok) {
    print('');
    print(`${INDENT}Continuing with the offline checks — a failed login does not stop the audit.`);
  }

  return client;
}

// ================================================================
//  3. COMMAND SET (runtime loader semantics)
// ================================================================
// Mirrors apps/bot/src/core/commandHandler.js -> loadCommands():
//   * apps/bot/src/commands first (may overwrite), then packages/systems
//     (may NOT overwrite an already registered name)
//   * `register: false` exports are skipped
//   * a command needs a `data` object AND an `execute` function
//   * duplicate names inside one module are skipped
// The deploy/registration rules (deploy-commands.js) are also evaluated so
// the "defined" side of the registration comparison matches exactly what
// was PUT to Discord.
async function loadCommands() {
  section('3. COMMAND SET (runtime loader rules)');

  const runtime = new Map();
  const deploy = new Map();
  const audit = {
    filesScanned: 0, modulesLoaded: 0, invalidExports: 0, importFailures: 0,
    duplicatesSkipped: 0, duplicatesOverwritten: 0, aliasSkipped: 0,
    deployValid: 0,
  };
  const importFailures = [];

  const loadDir = async (dir, allowOverwrite) => {
    let entries;
    try {
      entries = readdirSync(dir);
    } catch (err) {
      print(`${INDENT}⚠ Cannot read ${relTo(dir)} — ${scrub(err.message)}`);
      return;
    }
    for (const entry of entries) {
      const full = join(dir, entry);
      let isDir = false;
      try { isDir = statSync(full).isDirectory(); } catch { continue; }
      if (isDir) { await loadDir(full, allowOverwrite); continue; }
      if (!entry.endsWith('.js')) continue;
      audit.filesScanned += 1;

      let mod;
      try {
        mod = await import(pathToFileURL(full).href);
        audit.modulesLoaded += 1;
      } catch (err) {
        audit.importFailures += 1;
        importFailures.push(`${relTo(full)} — ${scrub(err?.message ?? err)}`);
        continue;
      }

      // The runtime loader and the deploy loader keep SEPARATE "seen" sets:
      // each one deduplicates the names it saw on its own.
      const runtimeSeen = new Set();
      const deploySeen = new Set();

      // ── runtime loader rules ──
      const registerRuntime = (command) => {
        if (!command || typeof command !== 'object') return;
        if (command.register === false) return;
        const hasData = Object.prototype.hasOwnProperty.call(command, 'data');
        const hasExecute = Object.prototype.hasOwnProperty.call(command, 'execute');
        if (!hasData && !hasExecute) return;
        const name = command?.data?.name;
        if (!name || typeof command?.execute !== 'function') { audit.invalidExports += 1; return; }
        if (runtimeSeen.has(name)) { audit.aliasSkipped += 1; return; }
        runtimeSeen.add(name);
        if (!allowOverwrite && runtime.has(name)) { audit.duplicatesSkipped += 1; return; }
        if (allowOverwrite && runtime.has(name)) audit.duplicatesOverwritten += 1;
        runtime.set(name, { name, command, source: relTo(full) });
      };

      // ── deploy / registration rules (deploy-commands.js) ──
      const registerDeploy = (command) => {
        if (!command || typeof command !== 'object') return;
        if (command.register === false) return;
        const data = command?.data;
        if (!data || typeof data.toJSON !== 'function') return;
        let json;
        try { json = data.toJSON(); } catch { audit.invalidExports += 1; return; }
        if (!json?.name) { audit.invalidExports += 1; return; }
        if (deploySeen.has(json.name)) return;
        deploySeen.add(json.name);
        if (!allowOverwrite && deploy.has(json.name)) { audit.duplicatesSkipped += 1; return; }
        if (allowOverwrite && deploy.has(json.name)) audit.duplicatesOverwritten += 1;
        deploy.set(json.name, { json, source: relTo(full) });
        audit.deployValid += 1;
      };

      if (mod.default) { registerRuntime(mod.default); registerDeploy(mod.default); }
      for (const [key, value] of Object.entries(mod)) {
        if (key === 'default') continue;
        registerRuntime(value);
        registerDeploy(value);
      }
    }
  };

  await loadDir(join(ROOT, 'apps/bot/src/commands'), true);
  await loadDir(join(ROOT, 'packages/systems'), false);

  state.runtimeCommands = runtime;
  state.deployCommands = deploy;
  state.loaderAudit = audit;

  print(`${INDENT}Files scanned        : ${audit.filesScanned}`);
  print(`${INDENT}Modules imported     : ${audit.modulesLoaded}`);
  print(`${INDENT}Commands registered  : ${runtime.size}  (runtime loader semantics)`);
  print(`${INDENT}Deployable payloads  : ${deploy.size}  (deploy-commands.js semantics)`);
  print(`${INDENT}Invalid exports      : ${audit.invalidExports}`);
  print(`${INDENT}Duplicate names      : ${audit.duplicatesSkipped} skipped, ${audit.duplicatesOverwritten} overwritten, ${audit.aliasSkipped} aliases skipped`);
  print(`${INDENT}Import failures      : ${audit.importFailures}`);

  if (importFailures.length) {
    print('');
    print(`${INDENT}  Modules that failed to import (their commands are NOT registered):`);
    for (const failure of importFailures) print(`${INDENT}    - ${failure}`);
    problem(`${audit.importFailures} command module(s) failed to import — those commands are missing at runtime.`);
    fix('Fix the failing command module(s) listed above — a module that cannot be imported contributes zero commands.');
  }

  const onlyRuntime = [...runtime.keys()].filter((n) => !deploy.has(n));
  const onlyDeploy = [...deploy.keys()].filter((n) => !runtime.has(n));
  if (onlyRuntime.length || onlyDeploy.length) {
    print('');
    print(`${INDENT}  Runtime/deploy set differences:`);
    if (onlyRuntime.length) print(`${INDENT}    loaded at runtime but not deployable: ${onlyRuntime.join(', ')}`);
    if (onlyDeploy.length) print(`${INDENT}    deployable but not loaded at runtime: ${onlyDeploy.join(', ')}`);
  }

  if (!runtime.size) {
    problem('No commands were loaded at all — the bot has nothing to dispatch.');
  }
}

// ================================================================
//  4. PERMISSION CROSS-CHECK
// ================================================================
function permNamesFor(bits) {
  try {
    const names = new PermissionsBitField(BigInt(bits)).toArray();
    return names.length ? names : [String(bits)];
  } catch {
    return [String(bits)];
  }
}

function toBitArray(value) {
  if (value === undefined || value === null) return [];
  const list = Array.isArray(value) ? value : [value];
  const bits = [];
  for (const entry of list) {
    if (entry === undefined || entry === null) continue;
    try { bits.push(BigInt(entry)); } catch { /* not a bitfield — ignore */ }
  }
  return bits;
}

/**
 * Collect every permission the command needs, tagged with the gate it came
 * from:
 *   botPermissions            — declared as a requirement for the BOT
 *   default_member_permissions — Discord's own "who may run this" gate
 *   userPermissions           — the app's custom gate for the CALLING USER
 * The bot must hold the union of all three to be able to carry the command
 * out, which is exactly what the runtime gate + the underlying action need.
 */
function gatesFor(command) {
  const gates = [];

  for (const bit of toBitArray(command.botPermissions)) {
    gates.push({ bit, name: permNamesFor(bit).join(' | '), gate: 'botPermissions' });
  }

  const rawMember = command.data?.default_member_permissions;
  if (rawMember !== undefined && rawMember !== null && String(rawMember) !== '' && String(rawMember) !== '0') {
    try {
      const field = new PermissionsBitField(BigInt(rawMember));
      for (const name of field.toArray()) {
        const bit = PermissionsBitField.Flags[name];
        if (bit === undefined) continue;
        gates.push({ bit, name, gate: 'default_member_permissions' });
      }
    } catch { /* unparsable bitfield — ignore */ }
  }

  for (const bit of toBitArray(command.userPermissions)) {
    gates.push({ bit, name: permNamesFor(bit).join(' | '), gate: 'userPermissions' });
  }

  // Merge duplicate bits, keeping every gate tag.
  const byBit = new Map();
  for (const g of gates) {
    const key = g.bit.toString();
    if (!byBit.has(key)) byBit.set(key, { bit: g.bit, name: g.name, gates: [] });
    byBit.get(key).gates.push(g.gate);
  }
  return [...byBit.values()];
}

async function guildPermissions(guild, botId) {
  // 1) gateway cache
  const cached = guild?.members?.me?.permissions;
  if (cached) {
    return { bitfield: cached, source: 'gateway cache (guild.members.me.permissions)' };
  }
  // 2) REST fallback
  try {
    const member = await api(`/guilds/${guild.id}/members/${botId}`);
    if (member?.permissions !== undefined && member?.permissions !== null) {
      return {
        bitfield: new PermissionsBitField(BigInt(member.permissions)),
        source: 'REST GET /guilds/{id}/members/{botId}',
      };
    }
  } catch (err) {
    return { bitfield: null, source: `unavailable (${scrub(err?.message ?? err)})` };
  }
  return { bitfield: null, source: 'unavailable' };
}

async function checkPermissions(client) {
  section('4. PERMISSION CROSS-CHECK (bot vs. every command)');

  if (!state.guilds.length) {
    print(`${INDENT}No guilds — nothing to check.`);
    return;
  }
  if (!state.runtimeCommands.size) {
    print(`${INDENT}No commands loaded — nothing to check.`);
    return;
  }

  const botId = state.bot?.id;
  const guildReports = [];
  let totalBlocked = 0;

  for (const guildSummary of state.guilds) {
    const guild = client?.guilds?.cache?.get(guildSummary.id) ?? null;
    const { bitfield, source } = await guildPermissions(guild, botId);

    print('');
    print(`${INDENT}── GUILD ${guildSummary.name ?? '(unknown)'} (${guildSummary.id})`);
    if (!bitfield) {
      print(`${INDENT}   Bot permissions : UNKNOWN (${source})`);
      warn(`Could not read the bot's permissions in "${guildSummary.name}".`);
      continue;
    }
    print(`${INDENT}   Bitfield        : ${bitfield.bitfield}  (${bitfield.toArray().join(', ') || 'none'})`);
    print(`${INDENT}   Source          : ${source}`);

    const buckets = { ok: [], blocked: [], ungated: [] };
    const blockedDetail = [];

    for (const entry of state.runtimeCommands.values()) {
      const gates = gatesFor(entry.command);
      if (!gates.length) {
        buckets.ungated.push(entry.name);
        continue;
      }
      const missing = gates.filter((g) => !bitfield.has(g.bit));
      if (!missing.length) {
        buckets.ok.push(entry.name);
      } else {
        buckets.blocked.push(entry.name);
        blockedDetail.push({
          name: entry.name,
          source: entry.source,
          missing: missing.map((m) => ({ name: m.name, gate: m.gates.join(' + ') })),
        });
      }
    }

    totalBlocked += buckets.blocked.length;

    print(`${INDENT}   Commands OK                       : ${buckets.ok.length}`);
    print(`${INDENT}   Commands BLOCKED (bot missing perm): ${buckets.blocked.length}`);
    print(`${INDENT}   Commands with no permission gate   : ${buckets.ungated.length}`);

    if (buckets.blocked.length) {
      print('');
      print(`${INDENT}   ⛔ BLOCKED COMMANDS (these fail for EVERY user in this guild):`);
      for (const item of blockedDetail) {
        const missing = item.missing.map((m) => `${m.name} [${m.gate}]`).join(', ');
        print(`${INDENT}     • /${item.name.padEnd(24)} missing: ${missing}`);
      }
    }

    if (buckets.ok.length) {
      print('');
      print(`${INDENT}   ✅ OK commands (${buckets.ok.length}):`);
      wrapList(buckets.ok.map((n) => `/${n}`), `${INDENT}     `);
    }

    if (buckets.ungated.length) {
      print('');
      print(`${INDENT}   🔓 No permission gate (${buckets.ungated.length}) — informational:`);
      wrapList(buckets.ungated.map((n) => `/${n}`), `${INDENT}     `);
    }

    guildReports.push({ guild: guildSummary, buckets, blockedDetail });

    if (buckets.blocked.length) {
      const perms = new Set();
      for (const item of blockedDetail) for (const m of item.missing) perms.add(m.name);
      fix(`Grant the bot the missing permission(s) in "${guildSummary.name}": ${[...perms].join(', ')} — ${buckets.blocked.length} command(s) are blocked (${buckets.blocked.slice(0, 6).map((n) => '/' + n).join(', ')}${buckets.blocked.length > 6 ? ', …' : ''}).`);
    }
  }

  state.guildReports = guildReports;
  state.totalBlocked = totalBlocked;
  if (totalBlocked) {
    problem(`${totalBlocked} command/guild combination(s) are blocked because the bot lacks a permission.`);
  }
}

// ================================================================
//  5. OFFLINE CHECKS
// ================================================================
function expectedColumns(model) {
  const raw = model.rawAttributes ?? {};
  const underscored = Boolean(model.options?.underscored);
  const columns = [];
  for (const [name, attribute] of Object.entries(raw)) {
    const column = attribute?.field
      || (underscored ? name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase() : name);
    columns.push({ attribute: name, column });
  }
  return columns;
}

async function checkDatabase() {
  section('5a. POSTGRESQL — reachability + schema drift');

  if (!process.env.DATABASE_URL) {
    print(`${INDENT}SKIPPED — DATABASE_URL is not set.`);
    problem('DATABASE_URL is not set — the bot cannot reach the database.');
    return;
  }

  let sequelize;
  try {
    const mod = await import('../../../packages/database/index.js');
    sequelize = mod.default ?? mod;
  } catch (err) {
    state.db.error = scrub(err?.message ?? err);
    print(`${INDENT}❌ Could not load the database package — ${state.db.error}`);
    problem(`The database package could not be loaded: ${state.db.error}`);
    return;
  }

  try {
    await sequelize.authenticate();
    state.db.reachable = true;
    print(`${INDENT}✅ Database reachable.`);
  } catch (err) {
    state.db.error = scrub(err?.message ?? err);
    print(`${INDENT}❌ DB UNREACHABLE — ${state.db.error}`);
    problem(`The database is unreachable: ${state.db.error}`);
    return;
  }

  const modelNames = Object.keys(sequelize.models ?? {}).sort();
  state.db.models = modelNames.length;
  print(`${INDENT}Models to verify: ${modelNames.length}`);

  const drift = [];
  let missingColumns = 0;
  let probeErrors = 0;

  for (const name of modelNames) {
    const model = sequelize.models[name];
    const table = model.tableName;
    const expected = expectedColumns(model);
    let dbColumns = new Set();
    let queryError = null;

    try {
      const rows = await sequelize.query(
        `SELECT column_name FROM information_schema.columns
          WHERE table_name = :table
            AND table_schema = COALESCE(:schema, current_schema())`,
        {
          type: QueryTypes.SELECT,
          replacements: { table, schema: model.options?.schema ?? null },
        },
      );
      dbColumns = new Set((rows ?? []).map((r) => r.column_name));
    } catch (err) {
      queryError = scrub(err?.message ?? err);
    }

    if (queryError) {
      probeErrors += 1;
      drift.push({ model: name, table, missing: [], error: queryError });
      continue;
    }

    const missing = expected.filter((c) => !dbColumns.has(c.column));
    missingColumns += missing.length;

    // Read-only probe: does a plain SELECT on the model work?
    let probeError = null;
    try {
      await model.findOne({ raw: true });
    } catch (err) {
      probeError = scrub(err?.message ?? err);
    }

    if (missing.length || probeError) {
      drift.push({
        model: name,
        table,
        missing: missing.map((m) => m.column),
        error: probeError,
        tableExists: dbColumns.size > 0,
      });
      if (probeError) probeErrors += 1;
    }
  }

  state.db.driftModels = drift;
  state.db.missingColumns = missingColumns;

  print('');
  if (!drift.length) {
    print(`${INDENT}✅ No schema drift — every model matches the live schema.`);
  } else {
    print(`${INDENT}❌ Schema drift detected in ${drift.length} model(s), ${missingColumns} missing column(s):`);
    for (const d of drift) {
      const details = [];
      if (!d.tableExists) details.push('TABLE MISSING');
      if (d.missing?.length) details.push(`missing columns: ${d.missing.join(', ')}`);
      if (d.error) details.push(`probe error: ${d.error}`);
      print(`${INDENT}   • ${d.model} → ${d.table}: ${details.join(' | ')}`);
    }
    problem(`Schema drift: ${drift.length} model(s) do not match the live database (${missingColumns} missing column(s)).`);
    fix('Run the database migrations so the live schema matches the Sequelize models (npm run db:migrate / prisma migrate deploy) — every query on a drifting model fails in production.');
  }

  try { await sequelize.close(); } catch { /* teardown must not mask the result */ }
}

async function checkRedis() {
  section('5b. REDIS — reachability');

  const url = process.env.REDIS_URL;
  if (!url) {
    print(`${INDENT}SKIPPED — REDIS_URL is not set.`);
    warn('REDIS_URL is not set — cooldowns and cached lookups are disabled.');
    fix('Set REDIS_URL so cooldowns, caches and rate limits work.');
    return;
  }

  const tls = process.env.REDIS_TLS === 'true' || url.includes('rediss://');
  const client = new Redis(url, {
    lazyConnect: true,
    connectTimeout: 5000,
    commandTimeout: 5000,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null,
    enableOfflineQueue: false,
    ...(tls ? { tls: {} } : {}),
  });
  client.on('error', () => {}); // the failure is reported explicitly below

  try {
    await client.connect();
    const pong = await client.ping();
    state.redis.ok = String(pong).toUpperCase() === 'PONG';
    print(`${INDENT}✅ Redis reachable — PING → ${pong}  (${tls ? 'TLS' : 'plaintext'})`);
    if (!state.redis.ok) {
      problem('Redis did not answer PING with PONG.');
    }
  } catch (err) {
    state.redis.error = scrub(err?.message ?? err);
    print(`${INDENT}❌ Redis unreachable — ${state.redis.error}`);
    problem(`Redis is unreachable: ${state.redis.error}`);
    fix('Fix the Redis connection (REDIS_URL / network / credentials) — cooldowns and caches are degraded while it is down.');
  } finally {
    try { await client.quit(); } catch { try { client.disconnect(); } catch { /* ignore */ } }
  }
}

async function checkAi() {
  section('5c. AI PROVIDER — availability');

  let aiService;
  try {
    const mod = await import('../../../packages/systems/ai/aiService.js');
    aiService = mod.default ?? mod;
  } catch (err) {
    state.ai.error = scrub(err?.message ?? err);
    print(`${INDENT}❌ Could not load the AI service — ${state.ai.error}`);
    warn(`The AI service could not be loaded: ${state.ai.error}`);
    return;
  }

  try {
    await aiService.init();
  } catch (err) {
    state.ai.error = scrub(err?.message ?? err);
    print(`${INDENT}⚠ AI init threw — ${state.ai.error}`);
  }

  state.ai.available = Boolean(aiService.isAvailable?.());
  const provider = aiService._resolveChatProvider?.() ?? process.env.AI_PROVIDER ?? 'unknown';
  state.ai.provider = provider;

  if (state.ai.available) {
    print(`${INDENT}✅ AI provider available: ${provider} (model ${aiService.model ?? '?'})`);
  } else {
    print(`${INDENT}❌ AI provider UNAVAILABLE (configured provider: ${provider}).`);
    print(`${INDENT}   Every AI command (/ai …) will answer "no AI provider available".`);
    warn('No AI chat provider is configured (GEMINI_API_KEY / Cloudflare credentials).');
    fix('Configure an AI provider (GEMINI_API_KEY or CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN) so the /ai commands work.');
  }
}

// ================================================================
//  6. SLASH COMMAND REGISTRATION SYNC
// ================================================================
function compareRegistered(label, registeredNames) {
  const registered = new Set(registeredNames);
  const defined = new Set(state.deployCommands.keys());
  const missing = [...defined].filter((n) => !registered.has(n)).sort();
  const stale = [...registered].filter((n) => !defined.has(n)).sort();
  print('');
  print(`${INDENT}── ${label}`);
  print(`${INDENT}   registered by Discord : ${registered.size}`);
  print(`${INDENT}   defined in code      : ${defined.size}`);
  print(`${INDENT}   missing from Discord : ${missing.length}${missing.length ? ` → ${missing.join(', ')}` : ''}`);
  print(`${INDENT}   stale on Discord     : ${stale.length}${stale.length ? ` → ${stale.join(', ')}` : ''}`);
  return { missing, stale, inSync: missing.length === 0 && stale.length === 0 };
}

async function checkRegistration() {
  section('6. SLASH COMMAND REGISTRATION SYNC');

  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId) {
    print(`${INDENT}SKIPPED — DISCORD_CLIENT_ID is not set.`);
    problem('DISCORD_CLIENT_ID is not set — registration state cannot be verified.');
    return;
  }
  if (!process.env.DISCORD_TOKEN) {
    print(`${INDENT}SKIPPED — DISCORD_TOKEN is not set.`);
    return;
  }

  try {
    const globalCmds = await api(`/applications/${clientId}/commands`);
    const global = compareRegistered('GLOBAL application commands', (globalCmds ?? []).map((c) => c.name));
    state.registration.global = global;
    if (global.missing.length || global.stale.length) {
      problem(`Global slash commands are out of sync (${global.missing.length} missing, ${global.stale.length} stale).`);
    }
  } catch (err) {
    print(`${INDENT}❌ Could not read the global command list — ${scrub(err?.message ?? err)}`);
    problem(`Could not read the global command list: ${err?.message ?? err}`);
  }

  for (const guild of state.guilds) {
    try {
      const guildCmds = await api(`/applications/${clientId}/guilds/${guild.id}/commands`);
      const report = compareRegistered(`GUILD commands — ${guild.name} (${guild.id})`, (guildCmds ?? []).map((c) => c.name));
      state.registration.guilds.push({ guild, ...report });
      if (report.missing.length || report.stale.length) {
        problem(`Slash commands in "${guild.name}" are out of sync (${report.missing.length} missing, ${report.stale.length} stale).`);
      }
    } catch (err) {
      print('');
      print(`${INDENT}── GUILD ${guild.name} (${guild.id})`);
      print(`${INDENT}   could not read: ${scrub(err?.message ?? err)}`);
      state.registration.guilds.push({ guild, missing: [], stale: [], inSync: false, error: err?.message ?? err });
      problem(`Could not read the slash command list for "${guild.name}": ${err?.message ?? err}`);
    }
  }

  const outOfSync = state.registration.guilds.filter((g) => !g.inSync).length
    + (state.registration.global && !state.registration.global.inSync ? 1 : 0);
  if (outOfSync) {
    fix('Re-register the slash commands: npm run deploy -- --all-guilds  (instant per-guild deploy + global).');
  }
}

// ================================================================
//  7. SUMMARY
// ================================================================
function summarise() {
  section('SUMMARY');

  const globalReg = state.registration.global;
  const guildReg = state.registration.guilds;
  const missingTotal = (globalReg?.missing.length ?? 0) + guildReg.reduce((n, g) => n + (g.missing?.length ?? 0), 0);
  const staleTotal = (globalReg?.stale.length ?? 0) + guildReg.reduce((n, g) => n + (g.stale?.length ?? 0), 0);

  const blockedNames = new Set();
  for (const report of state.guildReports ?? []) {
    for (const item of report.blockedDetail) blockedNames.add(item.name);
  }

  print(`${INDENT}Login                                  : ${state.login.ok ? 'OK' : 'FAILED'}`);
  print(`${INDENT}Guilds                                 : ${state.guilds.length}`);
  print(`${INDENT}Commands defined (runtime loader)      : ${state.runtimeCommands.size}`);
  print(`${INDENT}Commands blocked by missing bot perms  : ${state.totalBlocked ?? 0}`);
  if (blockedNames.size) {
    print(`${INDENT}   blocked command names                : ${[...blockedNames].sort().join(', ')}`);
  }
  print(`${INDENT}DB drift                               : ${state.db.driftModels.length} model(s), ${state.db.missingColumns} missing column(s)`);
  print(`${INDENT}Redis                                  : ${state.redis.ok ? 'OK' : 'FAILED'}`);
  print(`${INDENT}AI                                     : ${state.ai.available ? `OK (${state.ai.provider})` : 'unavailable'}`);
  print(`${INDENT}Registration                           : ${missingTotal === 0 && staleTotal === 0 ? 'in sync' : `${missingTotal} missing, ${staleTotal} stale`}`);

  if (state.warnings.length) {
    print('');
    print(`${INDENT}Warnings:`);
    for (const w of state.warnings) print(`${INDENT}   ⚠ ${w}`);
  }

  print('');
  print(`${INDENT}── PRIORITIZED FIXES ─────────────────────────────────────────`);
  if (!state.fixes.length) {
    print(`${INDENT}   Nothing to fix — the live stack is healthy.`);
  } else {
    state.fixes.forEach((f, i) => print(`${INDENT}   ${i + 1}. ${f}`));
  }

  print('');
  print(`${INDENT}── PROBLEMS (${state.problems.length}) ──────────────────────────────────`);
  if (!state.problems.length) {
    print(`${INDENT}   None.`);
  } else {
    state.problems.forEach((p, i) => print(`${INDENT}   ${i + 1}. ${p}`));
  }
}

// ================================================================
//  MAIN
// ================================================================
async function main() {
  banner('AURA BOT v2.0 — LIVE RUNTIME AUDIT (read-only)');
  print(`${INDENT}generated ${new Date().toISOString()} — node ${process.version}`);

  checkEnvironment();

  let client = null;
  try {
    client = await loginToDiscord();
    await loadCommands();
    await checkPermissions(client);
  } catch (err) {
    print('');
    print(`${INDENT}❌ Unexpected failure in the live section — ${scrub(err?.stack ?? err?.message ?? err)}`);
    problem(`Unexpected failure: ${err?.message ?? err}`);
  } finally {
    if (client) {
      try { await client.destroy(); } catch { /* ignore */ }
    }
  }

  // Offline checks always run, even when the gateway login failed.
  try { await checkDatabase(); } catch (err) { problem(`DB check crashed: ${err?.message ?? err}`); }
  try { await checkRedis(); } catch (err) { problem(`Redis check crashed: ${err?.message ?? err}`); }
  try { await checkAi(); } catch (err) { problem(`AI check crashed: ${err?.message ?? err}`); }

  // Registration sync is read-only HTTP GETs and needs the guild list only.
  try { await checkRegistration(); } catch (err) { problem(`Registration check crashed: ${err?.message ?? err}`); }

  summarise();

  const healthy = state.problems.length === 0;
  print('');
  print('═'.repeat(WIDTH));
  print(healthy
    ? '  ✅ LIVE RUNTIME AUDIT PASSED — the bot is fully operational.'
    : `  ❌ LIVE RUNTIME AUDIT FOUND ${state.problems.length} PROBLEM(S) — the bot is NOT fully operational.`);
  print('═'.repeat(WIDTH));

  return healthy ? 0 : 1;
}

let exitCode = 1;
try {
  exitCode = await main();
} catch (err) {
  console.error('  ❌ Fatal:', scrub(err?.stack ?? err?.message ?? err));
  exitCode = 1;
}
process.exit(exitCode);

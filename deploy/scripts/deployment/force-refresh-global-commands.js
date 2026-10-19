// ================================================================
//  FORCE REFRESH — GLOBAL SLASH COMMANDS
//  node deploy/scripts/deployment/force-refresh-global-commands.js
//
//  ⚠️  DESTRUCTIVE BY DESIGN — GUARDED.
//
//  What it does (only when explicitly allowed):
//    1. lists the guilds the bot has joined
//    2. WIPES the guild-scoped command overrides of every joined guild
//    3. WIPES the global command list (resets Discord's command cache)
//    4. re-registers the commands discovered by the command loader
//
//  Because steps 2 and 3 delete live registrations, the script is a
//  no-op unless an explicit flag is passed. Without a flag it only
//  prints the plan and exits — it never touches Discord.
//
//  Usage:
//    node deploy/scripts/deployment/force-refresh-global-commands.js
//        → DRY RUN: prints the plan, changes nothing
//    node deploy/scripts/deployment/force-refresh-global-commands.js --dry-run
//        → same as above (explicit)
//    node deploy/scripts/deployment/force-refresh-global-commands.js --force
//        → wipes guild overrides + global list, then re-registers
//        (asks for confirmation when run from an interactive terminal)
//    node deploy/scripts/deployment/force-refresh-global-commands.js --yes
//        → alias of --force, skips the interactive confirmation
//    node deploy/scripts/deployment/force-refresh-global-commands.js --register-only
//        → re-registers the global commands WITHOUT wiping anything
//
//  The command count is NEVER hardcoded — it is derived from
//  apps/bot/src/core/commandHandler.js at run time.
// ================================================================
import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { createInterface } from 'readline';

const args = process.argv.slice(2);
const hasFlag = (...names) => names.some((n) => args.includes(n));

const dryRun       = hasFlag('--dry-run', '--preview');
const force        = hasFlag('--force', '-f');
const yes          = hasFlag('--yes', '-y');
const registerOnly = hasFlag('--register-only', '--no-wipe');

// A wipe is only ever performed with an explicit --force / --yes.
const willWipe   = (force || yes) && !dryRun && !registerOnly;
const willDeploy = willWipe || (registerOnly && !dryRun);

if (hasFlag('--help', '-h')) {
  console.log(`
  FORCE REFRESH — GLOBAL SLASH COMMANDS (destructive, guarded)

  node deploy/scripts/deployment/force-refresh-global-commands.js
        → dry run: prints the plan, changes nothing
  node deploy/scripts/deployment/force-refresh-global-commands.js --dry-run
        → same as above (explicit)
  node deploy/scripts/deployment/force-refresh-global-commands.js --force
        → wipes guild overrides + global list, then re-registers
  node deploy/scripts/deployment/force-refresh-global-commands.js --yes
        → alias of --force, skips the interactive confirmation
  node deploy/scripts/deployment/force-refresh-global-commands.js --register-only
        → re-registers the global commands without wiping anything

  The command count is derived from the loader, never hardcoded.
`);
  process.exit(0);
}

// ── 1. Discover the commands through the real loader ─────────────
// The count comes from the command loader, so it can never drift from
// what the bot actually registers.
const { loadCommands } = await import('../../../apps/bot/src/core/commandHandler.js');
const dummyClient = { commands: new Map() };
await loadCommands(dummyClient);

const commandsToDeploy = [];
for (const cmd of dummyClient.commands.values()) {
  const json = typeof cmd?.data?.toJSON === 'function' ? cmd.data.toJSON() : null;
  if (json?.name) commandsToDeploy.push(json);
}
const commandCount = commandsToDeploy.length;

const line = '─'.repeat(64);
console.log(`\n${line}`);
console.log('  AURA BOT — FORCE REFRESH GLOBAL COMMANDS');
console.log(line);
console.log(`  Commands discovered by the loader: ${commandCount}`);
console.log(`  Mode: ${willWipe ? 'DESTRUCTIVE (--force)' : registerOnly && !dryRun ? 'RE-REGISTER ONLY' : 'DRY RUN — no changes will be made'}`);
console.log(line);

console.log('\nPlanned actions:');
if (willWipe) {
  console.log('  1. Fetch the guilds the bot has joined (read-only).');
  console.log(`  2. WIPE the guild-scoped command overrides of every joined guild.`);
  console.log('  3. WIPE the global command list (Discord command-cache reset).');
  console.log(`  4. Re-register the ${commandCount} commands discovered by the loader, globally.`);
} else if (registerOnly && !dryRun) {
  console.log('  1. Re-register the global command list (no wipe, no guild changes).');
} else {
  console.log('  1. Fetch the guilds the bot has joined (read-only).');
  console.log('  2. WIPE the guild-scoped command overrides of every joined guild.');
  console.log('  3. WIPE the global command list (Discord command-cache reset).');
  console.log(`  4. Re-register the ${commandCount} commands discovered by the loader, globally.`);
}
console.log(`\nCommands that would be registered (${commandCount}):`);
for (const c of commandsToDeploy) console.log(`   /${c.name}`);

// ── 2. Guard: no writes without an explicit flag ────────────────
if (!willDeploy) {
  console.log(`\n${line}`);
  console.log('  🔒 DRY RUN — NOTHING WAS MODIFIED.');
  console.log('  No Discord registration was read, cleared or written.');
  console.log('  This script wipes live command registrations; it refuses to');
  console.log('  do so without an explicit flag. Re-run with one of:');
  console.log('    --force          (wipe guild overrides + global list, then re-register)');
  console.log('    --yes            (same as --force, skips the interactive confirmation)');
  console.log('    --register-only  (re-register globally, wipe nothing)');
  console.log(`${line}\n`);
  process.exit(0);
}

// ── 3. Interactive confirmation (interactive terminals only) ────
if (willWipe && force && !yes && process.stdin.isTTY) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((resolve) => {
    rl.question('\n⚠️  This WIPES live command registrations. Type "yes" to continue: ', resolve);
  });
  rl.close();
  if (answer.trim().toLowerCase() !== 'yes') {
    console.log('\n❌ Aborted — nothing was modified.');
    process.exit(1);
  }
}

// ── 4. Apply ───────────────────────────────────────────────────
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error('\n❌ DISCORD_TOKEN / DISCORD_CLIENT_ID are required for a real deploy.');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

async function putWithRateLimitRetry(url, body) {
  let attempts = 0;
  while (attempts < 5) {
    attempts++;
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bot ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) return data;
    if (res.status === 429) {
      const waitSec = data.retry_after || 5;
      console.warn(`  ⏳ Rate limited (429). Waiting ${waitSec.toFixed(1)}s...`);
      await new Promise((r) => setTimeout(r, Math.ceil(waitSec * 1000) + 1000));
      continue;
    }
    throw new Error(`HTTP ${res.status}: ${data.message || 'unknown error'}`);
  }
  throw new Error('Exceeded max retries due to rate limiting.');
}

const API = 'https://discord.com/api/v10';

if (registerOnly && !willWipe) {
  console.log('\n🚀 Re-registering global commands (no wipe)...');
  const res = await putWithRateLimitRetry(`${API}/applications/${CLIENT_ID}/commands`, commandsToDeploy);
  console.log(`✅ Deployed ${res.length} commands globally.`);
  process.exit(0);
}

// 4.1 — read the guild list
console.log('\n🌐 Fetching the guilds the bot has joined...');
const gRes = await fetch(`${API}/users/@me/guilds`, { headers: { Authorization: `Bot ${TOKEN}` } });
if (!gRes.ok) {
  const body = await gRes.text().catch(() => '');
  console.error(`❌ Could not fetch guilds: HTTP ${gRes.status} ${body}`);
  process.exit(1);
}
const guilds = (await gRes.json().catch(() => [])).filter((g) => g && g.id);
console.log(`   Found ${guilds.length} guild(s).`);

// 4.2 — wipe the guild-scoped overrides
console.log(`\n🧹 Step 1: Wiping guild-level command overrides across ${guilds.length} guild(s)...`);
for (const guild of guilds) {
  try {
    await putWithRateLimitRetry(`${API}/applications/${CLIENT_ID}/guilds/${guild.id}/commands`, []);
    console.log(`  └─ Cleared guild ${guild.id}${guild.name ? ` (${guild.name})` : ''}`);
  } catch (e) {
    console.error(`  └─ Failed clearing guild ${guild.id}: ${e.message}`);
  }
}

// 4.3 — wipe the global list
console.log('\n🧹 Step 2: Wiping the global command list (Discord cache reset)...');
await putWithRateLimitRetry(`${API}/applications/${CLIENT_ID}/commands`, []);
console.log('  └─ Global commands wiped.');

console.log('\n⏱️  Waiting 3 seconds for Discord API cache invalidation...');
await new Promise((r) => setTimeout(r, 3000));

// 4.4 — re-register
console.log(`\n🚀 Step 3: Pushing ${commandCount} fresh commands to the global scope...`);
const res = await putWithRateLimitRetry(`${API}/applications/${CLIENT_ID}/commands`, commandsToDeploy);
console.log(`✅ Successfully deployed ${res.length} clean unique commands globally!`);
console.log(`   (loader reported ${commandCount} — Discord returned ${res.length})`);

process.exit(0);

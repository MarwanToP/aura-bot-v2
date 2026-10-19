// ================================================================
//  Live Discord registration check (read-only)
//  Compares the commands defined in code with what Discord actually
//  has registered — globally and per guild — for the bot in .env.
//
//  Usage:  node deploy/scripts/tests/check-live-registration.js
//  Secrets are never printed; only ids, names and counts.
// ================================================================
import 'dotenv/config';
import { readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const API = 'https://discord.com/api/v10';
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;

if (!token || !clientId) {
  console.log('❌ DISCORD_TOKEN / DISCORD_CLIENT_ID missing — cannot check live registration.');
  process.exit(2);
}

// ---------- collect the commands this repo would register ----------
const local = new Map();
const seenNames = new Set();

async function loadCommands(dir, allowOverwrite = true) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      await loadCommands(full, allowOverwrite);
      continue;
    }
    if (!entry.endsWith('.js')) continue;
    try {
      const mod = await import(pathToFileURL(full).href);
      const perFile = new Set();
      const register = (exportObj) => {
        if (!exportObj || typeof exportObj !== 'object') return;
        if (exportObj.register === false) return;
        const data = exportObj.data;
        if (!data || typeof data.toJSON !== 'function') return;
        const json = data.toJSON();
        if (!json?.name) return;
        if (perFile.has(json.name)) return;
        perFile.add(json.name);
        if (!allowOverwrite && local.has(json.name)) return;
        local.set(json.name, { json, source: full.replace(/\\/g, '/') });
      };
      register(mod.default);
      for (const [k, v] of Object.entries(mod)) if (k !== 'default') register(v);
    } catch (err) {
      console.log(`  ⚠ Could not import ${entry}: ${err.message}`);
    }
  }
}

async function api(pathname) {
  const res = await fetch(`${API}${pathname}`, {
    headers: { Authorization: `Bot ${token}` },
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (!res.ok) {
    const message = typeof data === 'string' ? data : data?.message || res.statusText;
    throw new Error(`HTTP ${res.status} ${message}`);
  }
  return data;
}

function report(label, registeredNames) {
  const registered = new Set(registeredNames);
  const missing = [...local.keys()].filter((n) => !registered.has(n)).sort();
  const extra = [...registered].filter((n) => !local.has(n)).sort();
  console.log(`\n=== ${label} ===`);
  console.log(`registered by Discord : ${registered.size}`);
  console.log(`defined in code      : ${local.size}`);
  console.log(`missing from Discord : ${missing.length}${missing.length ? ` -> ${missing.join(', ')}` : ''}`);
  console.log(`stale on Discord     : ${extra.length}${extra.length ? ` -> ${extra.join(', ')}` : ''}`);
  return missing.length === 0 && extra.length === 0;
}

(async () => {
  await loadCommands(join(__dirname, '../../../apps/bot/src/commands'), true);
  await loadCommands(join(__dirname, '../../../packages/systems'), false);
  console.log(`Commands defined in code: ${local.size}`);

  const me = await api('/users/@me');
  console.log(`Bot: ${me.username}#${me.discriminator} (id ${me.id})`);

  const guilds = await api('/users/@me/guilds');
  console.log(`Guilds the bot has joined: ${guilds.length}`);
  for (const g of guilds) console.log(`  - ${g.name} (${g.id}) owner=${g.owner ? 'yes' : 'no'}`);

  const globalCmds = await api(`/applications/${clientId}/commands`);
  const globalOk = report('GLOBAL application commands', globalCmds.map((c) => c.name));

  let allGuildsOk = true;
  for (const g of guilds) {
    let guildCmds;
    try {
      guildCmds = await api(`/applications/${clientId}/guilds/${g.id}/commands`);
    } catch (err) {
      console.log(`\n=== GUILD ${g.name} (${g.id}) ===\n  could not read: ${err.message}`);
      allGuildsOk = false;
      continue;
    }
    const ok = report(`GUILD commands — ${g.name} (${g.id})`, guildCmds.map((c) => c.name));
    allGuildsOk = allGuildsOk && ok;
  }

  console.log('\n--- summary ---');
  console.log(`global in sync : ${globalOk ? 'YES' : 'NO'}`);
  console.log(`guilds in sync : ${allGuildsOk ? 'YES' : 'NO'}`);
  if (!globalOk || !allGuildsOk) {
    console.log('\nFix with one of:');
    console.log('  npm run deploy -- --all-guilds      # instant guild deploy + global');
    console.log('  npm run deploy -- --guild <GUILD_ID> # instant for one guild');
    console.log('  npm run deploy                      # global only (up to 1h to propagate)');
  }
  process.exit(0);
})().catch((err) => {
  console.error('❌ Live registration check failed:', err.message);
  process.exit(1);
});

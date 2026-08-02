// ================================================================
//  Deploy Slash Commands — node scripts/deploy-commands.js
//  Add --guild <ID> for instant guild deploy
// ================================================================
import 'dotenv/config';
import { REST, Routes }           from 'discord.js';
import { readdirSync, statSync }  from 'fs';
import { join, dirname }          from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const commands  = new Map();
const args      = process.argv.slice(2);
const guildIdx  = args.indexOf('--guild');
const dryRun    = args.includes('--dry-run');
const guildArg  = guildIdx !== -1 ? args[guildIdx + 1] : null;
const guildId   = guildIdx !== -1
  ? ((guildArg && !guildArg.startsWith('--')) ? guildArg : (process.env.DISCORD_GUILD_ID || null))
  : null;
const audit = {
  filesScanned: 0,
  modulesLoaded: 0,
  validExports: 0,
  invalidExports: 0,
  duplicateAliasesSkipped: 0,
  duplicatesSkipped: 0,
  duplicatesOverwritten: 0,
  importFailures: 0,
};

function registerCommand(commandExport, allowOverwrite, sourceLabel, moduleSeenNames) {
  if (!commandExport || typeof commandExport !== 'object') return;
  if (commandExport.register === false) return;
  const command = commandExport.data;
  if (!command || typeof command.toJSON !== 'function') return;

  let json;
  try {
    json = command.toJSON();
  } catch (err) {
    audit.invalidExports += 1;
    console.warn(`  ⚠ Invalid command data in ${sourceLabel}: ${err.message}`);
    return;
  }

  if (!json?.name) {
    audit.invalidExports += 1;
    console.warn(`  ⚠ Missing command name in ${sourceLabel}`);
    return;
  }

  if (moduleSeenNames.has(json.name)) {
    audit.duplicateAliasesSkipped += 1;
    return;
  }
  moduleSeenNames.add(json.name);

  if (!allowOverwrite && commands.has(json.name)) {
    audit.duplicatesSkipped += 1;
    console.warn(`  ⚠ Duplicate command skipped: /${json.name} from ${sourceLabel}`);
    return;
  }
  if (allowOverwrite && commands.has(json.name)) {
    audit.duplicatesOverwritten += 1;
    console.warn(`  ⚠ Duplicate command overwritten: /${json.name} by ${sourceLabel}`);
  }
  commands.set(json.name, json);
  audit.validExports += 1;
}

async function loadCommands(dir, allowOverwrite = true) {
  for (const entry of readdirSync(dir)) {
    const full  = join(dir, entry);
    const isDir = statSync(full).isDirectory();
    if (isDir) { await loadCommands(full, allowOverwrite); continue; }
    if (!entry.endsWith('.js')) continue;
    audit.filesScanned += 1;
    try {
      const mod = await import(pathToFileURL(full).href);
      audit.modulesLoaded += 1;
      const moduleSeenNames = new Set();
      if (mod.default) registerCommand(mod.default, allowOverwrite, `${full}#default`, moduleSeenNames);
      for (const [k, v] of Object.entries(mod)) {
        if (k !== 'default') registerCommand(v, allowOverwrite, `${full}#${k}`, moduleSeenNames);
      }
    } catch (err) {
      audit.importFailures += 1;
      console.warn(`  ⚠ Skipping ${entry}: ${err.message}`);
    }
  }
}

async function putWithRateLimitRetry(url, body) {
  let attempts = 0;
  while (attempts < 5) {
    attempts++;
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) return data;
    if (res.status === 429) {
      const waitSec = data.retry_after || 5;
      const waitTime = Math.ceil(waitSec * 1000) + 1000;
      console.warn(`  ⏳ Rate limited by Discord API (429). Waiting ${waitSec.toFixed(1)}s before retry...`);
      await new Promise(r => setTimeout(r, waitTime));
      continue;
    }
    throw new Error(`HTTP ${res.status}: ${data.message || JSON.stringify(data)}`);
  }
  throw new Error('Exceeded max retries due to rate limiting.');
}

async function deploy() {
  if (!process.env.DISCORD_CLIENT_ID) {
    throw new Error('Missing DISCORD_CLIENT_ID in environment.');
  }
  if (!dryRun && !process.env.DISCORD_TOKEN) {
    throw new Error('Missing DISCORD_TOKEN in environment.');
  }
  if (guildIdx !== -1 && !guildId) {
    throw new Error('Guild deploy requested but no guild ID was provided. Pass --guild <ID> or set DISCORD_GUILD_ID.');
  }

  await loadCommands(join(__dirname, '../../../bot/cogs'), true);
  await loadCommands(join(__dirname, '../../shared/systems'), false);
  const dedup = [...commands.values()];

  console.log(`\n📋 Command Audit | files=${audit.filesScanned} modules=${audit.modulesLoaded} validExports=${audit.validExports} invalidExports=${audit.invalidExports} duplicateAliasesSkipped=${audit.duplicateAliasesSkipped} duplicatesSkipped=${audit.duplicatesSkipped} duplicatesOverwritten=${audit.duplicatesOverwritten} importFailures=${audit.importFailures}`);
  console.log(`\n🚀 ${dryRun ? 'Dry-run for' : 'Deploying'} ${dedup.length} commands...`);
  dedup.forEach(c => console.log(`   /${c.name}`));

  if (dryRun) {
    console.log('\n✅ Dry-run complete (no Discord API request made).');
    process.exit(0);
  }

  const clientId = process.env.DISCORD_CLIENT_ID;

  try {
    if (guildId) {
      console.log(`\n⏳ Registering commands to guild ${guildId}...`);
      const res = await putWithRateLimitRetry(`https://discord.com/api/v10/applications/${clientId}/guilds/${guildId}/commands`, dedup);
      console.log(`✅ Deployed ${res.length} commands to guild ${guildId} (instant)`);
    } else if (args.includes('--all-guilds')) {
      console.log('\n🌐 Fetching bot guilds for instant multi-guild deployment...');
      const gRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
        headers: { Authorization: `Bot ${process.env.DISCORD_TOKEN}` },
      });
      const guilds = await gRes.json().catch(() => []);
      console.log(`Found ${Array.isArray(guilds) ? guilds.length : 0} joined guilds.`);
      if (Array.isArray(guilds)) {
        for (const g of guilds) {
          try {
            console.log(`  ⏳ Deploying to ${g.name || g.id}...`);
            const res = await putWithRateLimitRetry(`https://discord.com/api/v10/applications/${clientId}/guilds/${g.id}/commands`, dedup);
            console.log(`  ✅ Deployed ${res.length} commands to guild ${g.name || g.id}`);
          } catch (err) {
            console.warn(`  ❌ Failed to deploy to guild ${g.id}: ${err.message}`);
          }
        }
      }
      console.log('\n⏳ Registering global commands...');
      try {
        const res = await putWithRateLimitRetry(`https://discord.com/api/v10/applications/${clientId}/commands`, dedup);
        console.log(`✅ Deployed ${res.length} commands globally.`);
      } catch (err) {
        console.warn(`⚠️ Global deploy warning: ${err.message}`);
      }
    } else {
      console.log('\n⏳ Registering global commands...');
      const res = await putWithRateLimitRetry(`https://discord.com/api/v10/applications/${clientId}/commands`, dedup);
      console.log(`✅ Deployed ${res.length} commands globally (up to 1 hour to propagate)`);
    }
  } catch (err) {
    console.error('❌ Deployment failed:', err.message);
    process.exit(1);
  }

  process.exit(0);
}

deploy().catch(err => { console.error('❌ Deploy failed:', err); process.exit(1); });

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

function registerCommand(command, allowOverwrite, sourceLabel, moduleSeenNames) {
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
      if (mod.default?.data) registerCommand(mod.default.data, allowOverwrite, `${full}#default`, moduleSeenNames);
      for (const [k, v] of Object.entries(mod)) {
        if (k !== 'default' && v?.data) registerCommand(v.data, allowOverwrite, `${full}#${k}`, moduleSeenNames);
      }
    } catch (err) {
      audit.importFailures += 1;
      console.warn(`  ⚠ Skipping ${entry}: ${err.message}`);
    }
  }
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

  await loadCommands(join(__dirname, '../../aura/commands'), true);
  await loadCommands(join(__dirname, '../systems'), false);
  const dedup = [...commands.values()];

  console.log(`\n📋 Command Audit | files=${audit.filesScanned} modules=${audit.modulesLoaded} validExports=${audit.validExports} invalidExports=${audit.invalidExports} duplicateAliasesSkipped=${audit.duplicateAliasesSkipped} duplicatesSkipped=${audit.duplicatesSkipped} duplicatesOverwritten=${audit.duplicatesOverwritten} importFailures=${audit.importFailures}`);
  console.log(`\n🚀 ${dryRun ? 'Dry-run for' : 'Deploying'} ${dedup.length} commands...`);
  dedup.forEach(c => console.log(`   /${c.name}`));

  if (dryRun) {
    console.log('\n✅ Dry-run complete (no Discord API request made).');
    return;
  }

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  if (guildId) {
    await rest.put(Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, guildId), { body: dedup });
    console.log(`\n✅ Deployed to guild ${guildId} (instant)`);
  } else {
    await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: dedup });
    console.log(`\n✅ Deployed globally (up to 1 hour to propagate)`);
  }
}

deploy().catch(err => { console.error('❌ Deploy failed:', err); process.exit(1); });

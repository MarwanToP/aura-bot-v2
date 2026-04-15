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
const commands  = [];
const args      = process.argv.slice(2);
const guildIdx  = args.indexOf('--guild');
const guildId   = guildIdx !== -1 ? args[guildIdx + 1] : null;

async function loadCommands(dir) {
  for (const entry of readdirSync(dir)) {
    const full  = join(dir, entry);
    const isDir = statSync(full).isDirectory();
    if (isDir) { await loadCommands(full); continue; }
    if (!entry.endsWith('.js')) continue;
    try {
      const mod = await import(pathToFileURL(full).href);
      if (mod.default?.data) commands.push(mod.default.data.toJSON());
      for (const [k, v] of Object.entries(mod)) {
        if (k !== 'default' && v?.data) commands.push(v.data.toJSON());
      }
    } catch (err) {
      console.warn(`  ⚠ Skipping ${entry}: ${err.message}`);
    }
  }
}

async function deploy() {
  await loadCommands(join(__dirname, '../src/commands'));

  // Deduplicate
  const seen  = new Set();
  const dedup = commands.filter(c => { if (seen.has(c.name)) return false; seen.add(c.name); return true; });

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  console.log(`\n🚀 Deploying ${dedup.length} commands...`);
  dedup.forEach(c => console.log(`   /${c.name}`));

  if (guildId) {
    await rest.put(Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, guildId), { body: dedup });
    console.log(`\n✅ Deployed to guild ${guildId} (instant)`);
  } else {
    await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: dedup });
    console.log(`\n✅ Deployed globally (up to 1 hour to propagate)`);
  }
}

deploy().catch(err => { console.error('❌ Deploy failed:', err); process.exit(1); });

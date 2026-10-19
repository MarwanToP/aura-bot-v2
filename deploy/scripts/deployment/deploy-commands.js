// ================================================================
//  Deploy Slash Commands — node deploy/scripts/deployment/deploy-commands.js
//
//  Uses the SAME loader as the running bot
//  (apps/bot/src/core/commandHandler.js) so a command that cannot be
//  imported at runtime is never published to Discord. Discord's PUT
//  REPLACES the whole command set, so a partially imported tree would
//  silently DELETE the commands of the broken file.
//
//  Flags:
//    --guild <ID>   instant guild-scoped deploy (falls back to DISCORD_GUILD_ID)
//    --all-guilds   deploy to every joined guild, then globally
//    --dry-run      audit only, no Discord API request
//    --force        publish even if a file failed to import (dangerous)
//
//  A command whose `data.toJSON()` throws is FATAL and is never published:
//  Discord's PUT REPLACES the whole command set, so publishing anyway would
//  DELETE that command from Discord while it still exists at runtime.
//  --force does not override this.
// ================================================================
import 'dotenv/config';
import { Collection } from 'discord.js';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { loadCommands } from '../../../apps/bot/src/core/commandHandler.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args      = process.argv.slice(2);
const guildIdx  = args.indexOf('--guild');
const dryRun    = args.includes('--dry-run');
const force     = args.includes('--force');
const guildArg  = guildIdx !== -1 ? args[guildIdx + 1] : null;
const guildId   = guildIdx !== -1
  ? ((guildArg && !guildArg.startsWith('--')) ? guildArg : (process.env.DISCORD_GUILD_ID || null))
  : null;

const logger = {
  info: (msg) => console.log(msg),
  warn: (msg) => console.warn(msg),
  error: (msg) => console.error(msg),
};

// Every Discord API request is bounded: a stalled connection used to hang
// the whole deploy for minutes without any output.
const DISCORD_API_TIMEOUT_MS = 20_000;

async function collectCommands() {
  // Minimal client stub: the loader only needs `commands` (a Collection) and
  // `logger`. The real client is not required to enumerate commands.
  const client = { commands: new Collection(), logger };
  const audit = await loadCommands(client);

  const payloads = [];
  const invalidExportDetails = [];
  for (const [name, command] of client.commands) {
    try {
      const json = command.data.toJSON();
      if (!json?.name) throw new Error('missing name');
      payloads.push(json);
    } catch (err) {
      invalidExportDetails.push({ name, error: err?.message || String(err) });
    }
  }

  return {
    payloads,
    audit,
    invalidExports: invalidExportDetails.length,
    invalidExportDetails,
  };
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
      signal: AbortSignal.timeout(DISCORD_API_TIMEOUT_MS),
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

/**
 * Every guild the bot has joined.
 *
 * The endpoint answers with at most 200 guilds per request, so the list is
 * paginated with the `after` parameter — otherwise every guild beyond the
 * first 200 was silently skipped.
 */
async function fetchJoinedGuilds() {
  const guilds = [];
  let after = null;

  for (let page = 0; page < 100; page++) {
    const url = new URL('https://discord.com/api/v10/users/@me/guilds');
    url.searchParams.set('limit', '200');
    if (after) url.searchParams.set('after', after);

    const res = await fetch(url, {
      headers: { Authorization: `Bot ${process.env.DISCORD_TOKEN}` },
      signal: AbortSignal.timeout(DISCORD_API_TIMEOUT_MS),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${data?.message || 'unknown error'}`);
    }
    if (!Array.isArray(data) || data.length === 0) break;

    guilds.push(...data);
    if (data.length < 200) break;
    after = data[data.length - 1]?.id;
    if (!after) break;
  }

  return guilds;
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

  const { payloads, audit, invalidExports, invalidExportDetails } = await collectCommands();

  console.log(`\n📋 Command Audit | files=${audit.filesScanned} modules=${audit.modulesLoaded} validExports=${audit.registered} invalidExports=${invalidExports} duplicateAliasesSkipped=${audit.duplicateAliasesSkipped} duplicatesSkipped=${audit.duplicatesSkipped} duplicatesOverwritten=${audit.duplicatesOverwritten} importFailures=${audit.importFailures}`);

  if (audit.importFailures > 0) {
    console.error(`\n❌ ${audit.importFailures} file(s) failed to import — their commands would be MISSING after this deploy:`);
    for (const detail of audit.importFailureDetails || []) {
      console.error(`   • ${detail.file}: ${detail.error}`);
    }
    if (!force) {
      console.error('\n🛑 Aborting. Fix the import errors, or re-run with --force to publish anyway (this will remove the broken commands from Discord).');
      process.exit(1);
    }
    console.warn('⚠️ --force given: publishing despite import failures.');
  }

  if (invalidExports > 0) {
    // Discord's PUT REPLACES the whole command set: a command that cannot be
    // serialized would be DELETED from Discord while it still works at
    // runtime. Nothing is published — the deploy is aborted.
    console.error(`\n❌ ${invalidExports} command(s) could not be serialized (data.toJSON() failed) — publishing would DELETE them from Discord:`);
    for (const detail of invalidExportDetails) {
      console.error(`   • /${detail.name}: ${detail.error}`);
    }
    console.error('\n🛑 Aborting without publishing anything. Fix the command definition and run the deploy again.');
    process.exit(1);
  }

  console.log(`\n🚀 ${dryRun ? 'Dry-run for' : 'Deploying'} ${payloads.length} commands...`);
  payloads.forEach(c => console.log(`   /${c.name}`));

  if (dryRun) {
    console.log('\n✅ Dry-run complete (no Discord API request made).');
    process.exit(0);
  }

  const clientId = process.env.DISCORD_CLIENT_ID;

  try {
    if (guildId) {
      console.log(`\n⏳ Registering commands to guild ${guildId}...`);
      const res = await putWithRateLimitRetry(`https://discord.com/api/v10/applications/${clientId}/guilds/${guildId}/commands`, payloads);
      console.log(`✅ Deployed ${res.length} commands to guild ${guildId} (instant)`);
    } else if (args.includes('--all-guilds')) {
      console.log('\n🌐 Fetching bot guilds for instant multi-guild deployment...');
      let guilds = [];
      try {
        guilds = await fetchJoinedGuilds();
      } catch (err) {
        console.warn(`⚠️ Could not fetch the joined guilds: ${err.message}`);
      }
      console.log(`Found ${guilds.length} joined guilds.`);
      for (const g of guilds) {
        try {
          console.log(`  ⏳ Deploying to ${g.name || g.id}...`);
          const res = await putWithRateLimitRetry(`https://discord.com/api/v10/applications/${clientId}/guilds/${g.id}/commands`, payloads);
          console.log(`  ✅ Deployed ${res.length} commands to guild ${g.name || g.id}`);
        } catch (err) {
          console.warn(`  ❌ Failed to deploy to guild ${g.id}: ${err.message}`);
        }
      }
      console.log('\n⏳ Registering global commands...');
      try {
        const res = await putWithRateLimitRetry(`https://discord.com/api/v10/applications/${clientId}/commands`, payloads);
        console.log(`✅ Deployed ${res.length} commands globally.`);
      } catch (err) {
        console.warn(`⚠️ Global deploy warning: ${err.message}`);
      }
    } else {
      console.log('\n⏳ Registering global commands...');
      const res = await putWithRateLimitRetry(`https://discord.com/api/v10/applications/${clientId}/commands`, payloads);
      console.log(`✅ Deployed ${res.length} commands globally (up to 1 hour to propagate)`);
    }
  } catch (err) {
    console.error('❌ Deployment failed:', err.message);
    process.exit(1);
  }

  process.exit(0);
}

deploy().catch(err => { console.error('❌ Deploy failed:', err); process.exit(1); });

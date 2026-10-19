// ================================================================
//  DEPLOY COMMANDS TO ALL ACTIVE GUILDS — thin wrapper
//  node deploy/scripts/deployment/deploy-active-guilds.js
//
//  This script used to re-implement the guild deployment on its own
//  and called `loadCommands(client, dir, allowOverwrite)` — a
//  signature that does not exist (the real loader is
//  `loadCommands(client)` in apps/bot/src/core/commandHandler.js),
//  so it crashed before it could register anything.
//
//  It is now a thin, correct wrapper around the canonical deploy
//  script, which already knows how to enumerate the bot's guilds:
//
//    node deploy/scripts/deployment/deploy-commands.js --all-guilds
//
//  That registers the commands per guild (instant) AND globally.
//
//  Usage:
//    node deploy/scripts/deployment/deploy-active-guilds.js
//        → same as `npm run deploy -- --all-guilds`
//    node deploy/scripts/deployment/deploy-active-guilds.js --dry-run
//        → prints the command list, no Discord API request
//    node deploy/scripts/deployment/deploy-active-guilds.js --guild <ID>
//        → forwarded; deploys to that single guild instead
// ================================================================
import { spawnSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const target = join(__dirname, 'deploy-commands.js');

const forwarded = process.argv.slice(2).filter((a) => a !== '--help' && a !== '-h');

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
  DEPLOY COMMANDS TO ALL ACTIVE GUILDS — thin wrapper

  node deploy/scripts/deployment/deploy-active-guilds.js [extra flags]

  Runs the canonical deploy script with --all-guilds:
    node deploy/scripts/deployment/deploy-commands.js --all-guilds

  Extra flags are forwarded (e.g. --dry-run, --guild <ID>).
`);
  process.exit(0);
}

console.log(`▶ Delegating to ${target} --all-guilds${forwarded.length ? ` ${forwarded.join(' ')}` : ''}`);

const result = spawnSync(process.execPath, [target, '--all-guilds', ...forwarded], {
  stdio: 'inherit',
  env: process.env,
});

if (result.error) {
  console.error('❌ Failed to run deploy-commands.js:', result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);

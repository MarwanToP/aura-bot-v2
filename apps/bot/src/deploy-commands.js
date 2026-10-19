// ================================================================
//  In-app slash-command deployment — thin wrapper (single source of truth)
//  ----------------------------------------------------------------
//  The actual logic lives in deploy/scripts/deployment/deploy-commands.js
//  (the script behind the root `npm run deploy`). That script has no
//  exports and no import guard: importing it executes its deploy() flow,
//  which reads process.argv itself — so flags such as --dry-run,
//  --guild <ID> and --all-guilds pass straight through.
//
//  Why this wrapper exists:
//    The runtime loader (apps/bot/src/core/commandHandler.js) loads BOTH
//    apps/bot/src/commands/** (overwrite allowed) AND packages/systems/**
//    (duplicates skipped). The root deploy script mirrors that two-source
//    rule. The previous in-app script scanned ONLY apps/bot/src/commands,
//    so running it would have unregistered the systems commands
//    (birthday, customcmd, bank, shop, giveaway, poll, social).
//    Delegating to the root script keeps both deploy entry points on the
//    exact same command set — no duplicated loader logic to drift.
// ================================================================
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load env independent of the cwd, mirroring packages/config's precedence:
// cwd .env first, then the monorepo-root .env as fallback (dotenv never
// overrides keys already present in process.env). The root deploy script's
// own `import 'dotenv/config'` is cwd-relative, so this keeps the in-app
// entry point working from any directory.
dotenv.config();
dotenv.config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) });

try {
  // Import for side effects: runs the full deploy and owns the exit code
  // (0 on success, 1 on failure), including --dry-run preview mode.
  await import('../../../deploy/scripts/deployment/deploy-commands.js');
} catch (err) {
  console.error('❌ Deploy failed:', err);
  process.exit(1);
}

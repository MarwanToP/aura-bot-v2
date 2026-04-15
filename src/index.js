// ================================================================
//  AURA BOT v2.0 — Unified Entry Point (Bot + Dashboard + KeepAlive)
// ================================================================
import 'dotenv/config';
import { ShardingManager } from 'discord.js';
import { fileURLToPath }   from 'url';
import { dirname, join }   from 'path';
import logger              from './utils/logger.js';
import { startKeepAlive }  from './keepalive.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Detect Environment
const isDiscloud = !!process.env.DISCLOUD || !!process.env.ID;

const required = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID'];
const missing  = required.filter(k => !process.env[k]);
if (missing.length) { logger.error(`Missing env vars: ${missing.join(', ')}`); process.exit(1); }

// ── 1. Start the Web Dashboard ──────────────────────────────────
// On Discloud Free, we disable it to save RAM and avoid Port errors
const dashboardEnabled = process.env.DASHBOARD_ENABLED !== 'false' && !isDiscloud;

if (dashboardEnabled) {
  import('./web/server.js').catch(err => {
    logger.error('[Dashboard] Failed to start:', err.message);
  });
  startKeepAlive();
} else if (isDiscloud) {
  logger.info('[System] Discloud environment detected — Running in 24/7 Bot-Only mode (Dashboard Disabled)');
}

// ── 2. Start the Bot ───────────────────────────────────────────
// To save memory on Discloud Free (100MB), we skip ShardingManager if needed
if (isDiscloud) {
  logger.info('[System] Starting Bot process directly to minimize RAM...');
  import('./bot.js').catch(err => logger.error('[Bot] Start failed:', err));
} else {
  const manager = new ShardingManager(join(__dirname, 'bot.js'), {
    token:       process.env.DISCORD_TOKEN,
    totalShards: process.env.SHARD_COUNT === 'auto' ? 'auto' : parseInt(process.env.SHARD_COUNT || '1'),
    respawn:     true,
  });

  manager.on('shardCreate', shard => {
    logger.info(`[Shard ${shard.id}] Launched`);
    shard.on('ready', () => logger.info(`[Shard ${shard.id}] Ready ✓`));
  });

  manager.spawn({ timeout: 60_000 }).catch(err => { logger.error('Spawn failed:', err); process.exit(1); });
}

process.on('unhandledRejection', r => logger.error('UnhandledRejection:', r));
process.on('uncaughtException',  e => { logger.error('UncaughtException:', e); process.exit(1); });

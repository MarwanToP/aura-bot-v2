// ================================================================
//  AURA BOT v2.0 — Unified Entry Point (Split-Core Architecture)
// ================================================================
import 'dotenv/config';
import { ShardingManager } from 'discord.js';
import { fileURLToPath }   from 'url';
import { dirname, join }   from 'path';
import logger              from './utils/logger.js';
import monitor             from './systems/monitor/monitorService.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Detect Mode: BOTH (default), DASHBOARD, or BOT
const MODE = process.env.MODE || 'BOTH';

const required = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID'];
const missing  = required.filter(k => !process.env[k]);
if (missing.length) { logger.error(`Missing env vars: ${missing.join(', ')}`); process.exit(1); }

logger.info(`[System] Initializing Aura Core in mode: ${MODE}`);

// ── 1. DASHBOARD MODE ──────────────────────────────────────────
if (MODE === 'DASHBOARD' || MODE === 'BOTH') {
  logger.info('[System] Starting Dashboard Intelligence Engine...');
  monitor.startHeartbeat('dashboard');
  if (MODE === 'BOTH' || MODE === 'DASHBOARD') {
    monitor.startAlertLoop(); // Only one process needs to monitor others
  }
  import('./web/server.js').catch(err => {
    logger.error('[Dashboard] Failed to start:', err.message);
  });
}

// ── 2. BOT MODE ───────────────────────────────────────────────
if (MODE === 'BOT' || MODE === 'BOTH') {
  logger.info('[System] Starting Bot Logic Core...');
  monitor.startHeartbeat('bot');
  
  // If running as a Render Web Service in BOT mode, bind to PORT to pass healthchecks
  if (MODE === 'BOT' && process.env.PORT) {
    import('http').then(({ createServer }) => {
      createServer((req, res) => {
        res.writeHead(200);
        res.end('Aura Bot is online.');
      }).listen(process.env.PORT, '0.0.0.0', () => {
        logger.info(`[HealthCheck] Dummy server listening on port ${process.env.PORT}`);
      });
    });
  }

  
  // If we are on a memory-constrained host like Discloud, skip ShardingManager
  const isDiscloud = !!process.env.DISCLOUD || !!process.env.ID;
  
  if (isDiscloud) {
    logger.info('[System] Memory-Saving Mode Active: Starting single bot instance.');
    import('./bot.js').catch(err => logger.error('[Bot] Start failed:', err));
  } else {
    const manager = new ShardingManager(join(__dirname, 'bot.js'), {
      token:       process.env.DISCORD_TOKEN,
      totalShards: parseInt(process.env.SHARD_COUNT || '1'),
      respawn:     true,
    });

    manager.on('shardCreate', shard => {
      logger.info(`[Shard ${shard.id}] Launched`);
      shard.on('ready', () => logger.info(`[Shard ${shard.id}] Ready ✓`));
    });

    manager.spawn({ timeout: 60_000 }).catch(err => {
      logger.error('[System] Shard spawning failed:', err.message);
      process.exit(1);
    });
  }
}

process.on('unhandledRejection', r => logger.error('UnhandledRejection:', r));
process.on('uncaughtException',  e => { logger.error('UncaughtException:', e); process.exit(1); });

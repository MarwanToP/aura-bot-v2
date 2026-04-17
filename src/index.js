// ================================================================
//  AURA BOT v2.0 — Unified Entry Point (Split-Core Architecture)
// ================================================================
import 'dotenv/config';
import { ShardingManager } from 'discord.js';
import { fileURLToPath }   from 'url';
import { dirname, join }   from 'path';
import http                from 'http';
import logger              from './utils/logger.js';
import monitor             from './systems/monitor/monitorService.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── 1. Configuration & Validation ──────────────────────────────
const MODE = process.env.MODE || 'BOTH';
const REQUIRED_ENV_VARS = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID'];

const missingVars = REQUIRED_ENV_VARS.filter(key => !process.env[key]);
if (missingVars.length) {
  logger.error(`[System] Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

logger.info(`[System] Initializing Aura Core | Mode: ${MODE}`);

// ── 2. Helper: Mode Checks ──────────────────────────────────────
const shouldRunDashboard = ['DASHBOARD', 'BOTH'].includes(MODE);
const shouldRunBot       = ['BOT', 'BOTH'].includes(MODE);

// ── 3. Dashboard Initialization ─────────────────────────────────
if (shouldRunDashboard) {
  logger.info('[Dashboard] Starting Intelligence Engine...');
  monitor.startHeartbeat('dashboard');
  
  // Start the global alert monitoring loop
  monitor.startAlertLoop();

  import('./web/server.js').catch(err => {
    logger.error('[Dashboard] Critical failure during startup:', err.message);
  });
}

// ── 4. Bot Initialization ───────────────────────────────────────
if (shouldRunBot) {
  logger.info('[Bot] Starting Logic Core...');
  monitor.startHeartbeat('bot');

  /**
   * Health Check Server
   * Required for Render.com when running in BOT-only mode to prevent deployment timeouts.
   */
  if (MODE === 'BOT' && process.env.PORT) {
    http.createServer((req, res) => {
      res.writeHead(200);
      res.end('Aura Bot Status: Online');
    }).listen(process.env.PORT, '0.0.0.0', () => {
      logger.info(`[HealthCheck] Binding heartbeat to port ${process.env.PORT}`);
    });
  }

  // Handle Sharding based on environment constraints (e.g., Discloud 100MB limit)
  const isMemoryConstrained = !!process.env.DISCLOUD || !!process.env.ID;

  if (isMemoryConstrained) {
    logger.info('[Bot] Memory-Saving Mode: Initializing single instance (No Sharding).');
    import('./bot.js').catch(err => logger.error('[Bot] Instance failed:', err));
  } else {
    initializeSharding();
  }
}

/**
 * Initializes the Discord.js ShardingManager for high-availability.
 */
function initializeSharding() {
  const manager = new ShardingManager(join(__dirname, 'bot.js'), {
    token:       process.env.DISCORD_TOKEN,
    totalShards: parseInt(process.env.SHARD_COUNT || '1'),
    respawn:     true,
  });

  manager.on('shardCreate', shard => {
    logger.info(`[Shard ${shard.id}] Launched`);
    shard.on('ready', () => logger.info(`[Shard ${shard.id}] Successfully initialized ✓`));
  });

  manager.spawn({ timeout: 60_000 }).catch(err => {
    logger.error('[System] Sharding failed to spawn:', err.message);
    process.exit(1);
  });
}

// ── 5. Error Handling ───────────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

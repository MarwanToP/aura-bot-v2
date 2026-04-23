// ================================================================
//  AURA BOT v2.0 — Unified Entry Point (Split-Core Architecture)
// ================================================================
import 'dotenv/config';
import { ShardingManager } from 'discord.js';
import { fileURLToPath }   from 'url';
import { dirname, join }   from 'path';
import http                from 'http';
import logger              from './shared/utils/logger.js';
import monitor             from './shared/systems/monitor/monitorService.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── 1. Configuration & Validation ──────────────────────────────
const MODE = (process.env.MODE || 'BOTH').trim().toUpperCase();
const allowedModes = new Set(['BOT', 'DASHBOARD', 'BOTH']);
if (!allowedModes.has(MODE)) {
  logger.error(`[System] Invalid MODE "${process.env.MODE}". Use BOT, DASHBOARD, or BOTH.`);
  process.exit(1);
}

const shouldRunDashboard = ['DASHBOARD', 'BOTH'].includes(MODE);
const shouldRunBot       = ['BOT', 'BOTH'].includes(MODE);
let shardingManager      = null;
let healthCheckServer    = null;
let isShuttingDown       = false;

const requiredEnvVars = new Set();
if (shouldRunBot) requiredEnvVars.add('DISCORD_TOKEN');
if (shouldRunDashboard) {
  requiredEnvVars.add('DISCORD_CLIENT_ID');
  requiredEnvVars.add('DISCORD_CLIENT_SECRET');
}

const missingVars = [...requiredEnvVars].filter(key => !process.env[key]);
if (missingVars.length) {
  logger.error(`[System] Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

logger.info(`[System] Initializing Aura Core | Mode: ${MODE}`);

// ── 2. Dashboard Initialization ─────────────────────────────────
if (shouldRunDashboard) {
  logger.info('[Dashboard] Starting Intelligence Engine...');
  monitor.startHeartbeat('dashboard');
  
  // Start the global alert monitoring loop
  monitor.startAlertLoop();

  import('./website/server.js').catch(err => {
    logger.error('[Dashboard] Critical failure during startup:', err);
    if (!shouldRunBot) {
      process.exit(1);
    }
  });

  // Start the 24/7 Uptime Pulse
  monitor.startPulse();
}

// ── 3. Bot Initialization ───────────────────────────────────────
if (shouldRunBot) {
  logger.info('[Bot] Starting Logic Core...');
  monitor.startHeartbeat('bot');

  /**
   * Health Check Server
   * Required for Render.com when running in BOT-only mode to prevent deployment timeouts.
   */
  if (MODE === 'BOT' && process.env.PORT) {
    healthCheckServer = http.createServer((req, res) => {
      if (req.url === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', mode: 'BOT', uptime: process.uptime() }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Aura Bot Status: Online');
    });
    
    healthCheckServer.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.warn(`[HealthCheck] Port ${process.env.PORT} is already in use. Skipping dedicated bot HTTP server.`);
      } else {
        logger.error(`[HealthCheck] Server error:`, err);
      }
    });

    healthCheckServer.listen(process.env.PORT, '0.0.0.0', () => {
      logger.info(`[HealthCheck] Binding heartbeat to port ${process.env.PORT}`);
    });
  } else if (MODE === 'BOT') {
    logger.info('[HealthCheck] BOT mode running without HTTP listener (valid for worker services).');
  }

  // Handle Sharding based on environment constraints (e.g., Discloud 100MB limit, Render Free 512MB)
  const isMemoryConstrained = !!process.env.DISCLOUD || !!process.env.ID || !!process.env.RENDER || !!process.env.RAILWAY_ENVIRONMENT;

  if (isMemoryConstrained) {
    logger.info('[Bot] Memory-Saving Mode: Initializing single instance (No Sharding).');
    import('./aura/bot.js').catch(err => {
      logger.error('[Bot] Instance failed:', err);
      if (!shouldRunDashboard) {
        process.exit(1);
      }
    });
  } else {
    shardingManager = initializeSharding();
  }
}

/**
 * Initializes the Discord.js ShardingManager for high-availability.
 */
function initializeSharding() {
  const shardConfig = process.env.SHARD_COUNT?.trim();
  const totalShards = !shardConfig || shardConfig.toLowerCase() === 'auto'
    ? 'auto'
    : Number.parseInt(shardConfig, 10);

  if (totalShards !== 'auto' && !Number.isFinite(totalShards)) {
    logger.error('[System] Invalid SHARD_COUNT. Use a number or "auto".');
    process.exit(1);
  }

  const manager = new ShardingManager(join(__dirname, 'aura/bot.js'), {
    token:       process.env.DISCORD_TOKEN,
    totalShards,
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

// ── 4. Error Handling & Telegram Alerts ──────────────────────────
let isFatalShutdownScheduled = false;
const formatErrorDetail = (value) => {
  if (value instanceof Error) {
    return value.stack || value.message;
  }
  if (typeof value === 'object' && value !== null) {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
};

const scheduleFatalRestart = async (type, detail) => {
  if (isFatalShutdownScheduled) return;
  isFatalShutdownScheduled = true;

  const alertMessage = `🚨 **[CRITICAL] Aura Bot Crash** 🚨\n\n**Type**: ${type}\n**Details**: ${detail}\n\n*Server is attempting to restart...*`;
  const alertAttempt = monitor.sendAlert(alertMessage).catch((alertErr) => {
    logger.error('[System] Failed to send crash alert:', alertErr);
  });

  await Promise.race([
    alertAttempt,
    new Promise((resolve) => setTimeout(resolve, 2000)),
  ]);

  process.exit(1);
};

process.on('unhandledRejection', async (reason) => {
  logger.error('Unhandled Promise Rejection:', reason);
  const reasonText = formatErrorDetail(reason);
  await scheduleFatalRestart('Unhandled Rejection', reasonText);
});

process.on('uncaughtException', async (error) => {
  logger.error('Uncaught Exception:', error);
  const errorText = formatErrorDetail(error);
  await scheduleFatalRestart('Uncaught Exception', errorText);
});

const closeHealthCheckServer = async () => {
  if (!healthCheckServer?.listening) return;

  await new Promise((resolve, reject) => {
    healthCheckServer.close((err) => {
      if (err) return reject(err);
      resolve();
    });
  });
};

const stopShards = async () => {
  if (!shardingManager) return;

  const results = await Promise.allSettled(
    [...shardingManager.shards.values()].map(async (shard) => {
      try {
        shard.kill();
      } catch (err) {
        logger.error(`[Shard ${shard.id}] Failed to stop cleanly:`, err);
        throw err;
      }
    }),
  );

  if (results.some((result) => result.status === 'rejected')) {
    throw new Error('One or more shards failed to stop cleanly.');
  }
};

const shutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info(`[System] ${signal} received — graceful shutdown initiated.`);

  let exitCode = 0;

  try {
    await closeHealthCheckServer();
  } catch (err) {
    exitCode = 1;
    logger.error('[System] Failed to close health check server:', err);
  }

  try {
    await stopShards();
  } catch {
    exitCode = 1;
  }

  if (!shouldRunDashboard) {
    process.exit(exitCode);
    return;
  }

  setTimeout(() => process.exit(exitCode), 15000).unref();
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

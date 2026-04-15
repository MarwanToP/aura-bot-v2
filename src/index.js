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

const required = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID'];
const missing  = required.filter(k => !process.env[k]);
if (missing.length) { logger.error(`Missing env vars: ${missing.join(', ')}`); process.exit(1); }

// ── 1. Start the Web Dashboard in this same process ────────────
if (process.env.DASHBOARD_ENABLED !== 'false') {
  import('./web/server.js').catch(err => {
    logger.error('[Dashboard] Failed to start:', err.message);
  });
}

// ── 2. Start the Keep-Alive pinger ─────────────────────────────
startKeepAlive();

// ── 3. Start the Bot via ShardingManager ───────────────────────
const manager = new ShardingManager(join(__dirname, 'bot.js'), {
  token:       process.env.DISCORD_TOKEN,
  totalShards: process.env.SHARD_COUNT === 'auto' ? 'auto' : parseInt(process.env.SHARD_COUNT || '1'),
  respawn:     true,
});

manager.on('shardCreate', shard => {
  logger.info(`[Shard ${shard.id}] Launched`);
  shard.on('ready',        ()  => logger.info(`[Shard ${shard.id}] Ready ✓`));
  shard.on('disconnect',   ()  => logger.warn(`[Shard ${shard.id}] Disconnected`));
  shard.on('reconnecting', ()  => logger.info(`[Shard ${shard.id}] Reconnecting...`));
  shard.on('death',        (p) => logger.error(`[Shard ${shard.id}] Died PID:${p.pid}`));
  shard.on('error',        (e) => logger.error(`[Shard ${shard.id}] ${e.message}`));
});

process.on('unhandledRejection', r => logger.error('UnhandledRejection:', r));
process.on('uncaughtException',  e => { logger.error('UncaughtException:', e); process.exit(1); });

manager.spawn({ timeout: 30_000 }).catch(err => { logger.error('Spawn failed:', err); process.exit(1); });

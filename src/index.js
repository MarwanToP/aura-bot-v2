// ================================================================
//  AURA BOT v2.0 — Entry Point
// ================================================================
import 'dotenv/config';
import { ShardingManager } from 'discord.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import logger from './utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const required = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID'];
const missing  = required.filter(k => !process.env[k]);
if (missing.length) { logger.error(`Missing env vars: ${missing.join(', ')}`); process.exit(1); }

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

logger.info(`
╔═══════════════════════════════════════════════╗
║    ✨  AURA BOT v2.0  —  ENTERPRISE + AI  ✨  ║
║   MEE6-class • Bilingual AR/EN • OpenAI/Claude ║
╚═══════════════════════════════════════════════╝`);

manager.spawn({ timeout: 30_000 }).catch(err => { logger.error('Spawn failed:', err); process.exit(1); });

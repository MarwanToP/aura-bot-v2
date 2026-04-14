// ================================================================
//  AURA BOT v2.0 — Shard Client
// ================================================================
import 'dotenv/config';
import { Client, GatewayIntentBits, Partials, Collection, Options } from 'discord.js';
import logger           from './utils/logger.js';
import database         from './database/index.js';
import redis            from './database/redis.js';
import { loadCommands } from './handlers/commandHandler.js';
import { loadEvents   } from './handlers/eventHandler.js';
import i18n             from './utils/i18n.js';
import aiService        from './systems/ai/aiService.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildScheduledEvents,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember, Partials.User],
  makeCache: Options.cacheWithLimits({ MessageManager: 500, UserManager: 200, GuildMemberManager: 500 }),
  failIfNotExists: false,
});

// ── Collections ──────────────────────────────────────────────
client.commands    = new Collection();
client.cooldowns   = new Collection();
client.antiNuke    = new Collection();
client.tickets     = new Collection();
client.voiceSessions = new Map();
client.inviteCache   = new Map();

// ── Services ────────────────────────────────────────────────
client.db     = database;
client.redis  = redis;
client.i18n   = i18n;
client.logger = logger;
client.ai     = aiService;

// ── Boot ─────────────────────────────────────────────────────
async function boot() {
  try {
    logger.info('[Boot] Connecting to database...');
    await database.authenticate();
    await database.sync({ alter: process.env.NODE_ENV === 'development' });
    logger.info('[Boot] Database ready ✓');

    logger.info('[Boot] Connecting to Redis...');
    await redis.ping();
    logger.info('[Boot] Redis ready ✓');

    logger.info('[Boot] Initializing i18n...');
    await i18n.init();
    logger.info('[Boot] i18n ready ✓');

    logger.info('[Boot] Initializing AI service...');
    await aiService.init();
    logger.info(`[Boot] AI ready ✓ (provider: ${process.env.AI_PROVIDER || 'openai'})`);

    logger.info('[Boot] Loading commands...');
    await loadCommands(client);
    logger.info(`[Boot] ${client.commands.size} commands loaded ✓`);

    logger.info('[Boot] Loading events...');
    await loadEvents(client);
    logger.info('[Boot] Events loaded ✓');

    logger.info('[Boot] Logging in...');
    await client.login(process.env.DISCORD_TOKEN);
  } catch (err) {
    logger.error('[Boot] Failed:', err);
    process.exit(1);
  }
}

async function shutdown(signal) {
  logger.info(`[Shutdown] ${signal} received — graceful shutdown...`);
  client.destroy();
  await database.close();
  redis.disconnect();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('unhandledRejection', r => logger.error('Shard rejection:', r));

boot();
export default client;

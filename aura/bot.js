// ================================================================
//  AURA BOT v2.0 — Shard Client
// ================================================================
import 'dotenv/config';
import { Client, GatewayIntentBits, Partials, Collection, Options } from 'discord.js';
import logger           from '../shared/utils/logger.js';
import database         from '../shared/database/index.js';
import redis            from '../shared/database/redis.js';
import { loadCommands } from './handlers/commandHandler.js';
import { loadEvents   } from './handlers/eventHandler.js';
import i18n             from '../shared/utils/i18n.js';
import aiService        from '../shared/systems/ai/aiService.js';
import { initializeTicketPanel } from '../shared/systems/tickets/ticketSystem.js';

// ── 1. Create the Client ──────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember],
  
  // ── Memory Optimization (Critical for Discloud 100MB) ──
  makeCache: Options.cacheWithLimits({
    MessageManager: 0,      // Total disabled (saves ~50-100MB)
    ThreadManager: 0,
    UserManager: 10,        // Minimal cache
    GuildMemberManager: 10,
    PresenceManager: 0,
    ReactionManager: 0,
    StageInstanceManager: 0,
  }),
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

    logger.info('[Boot] Starting realtime sync subscriptions...');
    await setupRealtimeSync(client);
    logger.info('[Boot] Realtime sync ready ✓');

    logger.info('[Boot] Logging in...');
    await client.login(process.env.DISCORD_TOKEN);
  } catch (err) {
    logger.error('[Boot] Failed:', err);
    process.exit(1);
  }
}

async function setupRealtimeSync(client) {
  const subscriber = client.redis.duplicate();
  client.realtimeSubscriber = subscriber;

  subscriber.on('error', (err) => {
    logger.warn(`[RealtimeSync] Subscriber error: ${err.message}`);
  });

  await subscriber.subscribe('aura:config_update', 'aura:ticket_panel_update');

  subscriber.on('message', async (channel, rawMessage) => {
    try {
      const payload = JSON.parse(rawMessage || '{}');

      if (channel === 'aura:config_update') {
        const guildId = String(payload?.guildId || '').trim();
        if (!guildId) return;

        const safeGuildId = encodeURIComponent(guildId);
        await client.redis.del(
          `settings:restrictions:${safeGuildId}`,
          `settings:aliases:${safeGuildId}`,
          `guild:premium:${guildId}`
        );

        logger.info(`[RealtimeSync] Config cache invalidated for guild ${guildId}`);
        return;
      }

      if (channel === 'aura:ticket_panel_update') {
        const guildId = String(payload?.guildId || '').trim();
        const panelId = String(payload?.panelId || '').trim();
        if (!panelId) return;

        await initializeTicketPanel(client, panelId, guildId || null);
        logger.info(`[RealtimeSync] Ticket panel refreshed (${guildId || 'unknown guild'} / ${panelId})`);
      }
    } catch (err) {
      logger.warn(`[RealtimeSync] Failed to process ${channel}: ${err.message}`);
    }
  });
}

async function shutdown(signal) {
  logger.info(`[Shutdown] ${signal} received — graceful shutdown...`);
  client.destroy();
  try {
    await client.realtimeSubscriber?.quit();
  } catch {}
  await database.close();
  try {
    await redis.quit();
  } catch {
    redis.disconnect();
  }
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('unhandledRejection', r => logger.error('Shard rejection:', r));

boot();
export default client;

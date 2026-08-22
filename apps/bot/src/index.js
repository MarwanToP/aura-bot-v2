import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js';
import { env } from '../../../packages/config/src/env.js';
import { handleInteraction } from './handlers/interactionHandler.js';
import { handleVoiceStateUpdate } from './modules/tempVoice.js';
import { loadCommands } from './handlers/commandHandler.js';
import { handleMessageCreate } from './events/messageCreate.js';
import { initModerationActionSubscriber } from './handlers/actionSubscriber.js';
import database from '../../../packages/database/index.js';
import redis from '../../../packages/redis/index.js';
import i18n from '../../../packages/utils/i18n.js';
import aiService from '../../../packages/systems/ai/aiService.js';
import logger from '../../../packages/utils/logger.js';

// 1. Trap unhandled errors to keep the process alive
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('🚨 Uncaught Exception thrown:', err);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
  // Keep-alive websocket options
  ws: {
    properties: {
      browser: 'Discord iOS',
    },
  },
});

client.commands = new Collection();
client.db = database;
client.redis = redis;
client.i18n = i18n;
client.ai = aiService;
client.logger = logger;
client.voiceSessions = new Map();

// Online confirmation
client.once('ready', () => {
  console.log(`\n========================================`);
  console.log(`✅ AURA BOT IS NOW ONLINE!`);
  console.log(`🤖 Logged in as: ${client.user.tag}`);
  console.log(`🌐 Connected Guilds: ${client.guilds.cache.size}`);
  console.log(`========================================\n`);

  // Set dynamic rich presence
  client.user.setPresence({
    activities: [{ name: 'over Aura Servers | /help', type: 3 }], // 3 = WATCHING
    status: 'online',
  });
});

// Auto-reconnect handling
client.on('shardDisconnect', (event, id) => {
  console.warn(`⚠️ Shard ${id} disconnected (${event.code}). Attempting to reconnect...`);
});

client.on('shardReconnecting', (id) => {
  console.log(`🔄 Shard ${id} reconnecting to Discord Gateway...`);
});

client.on('shardResume', (id, replayedEvents) => {
  console.log(`✅ Shard ${id} resumed connection (${replayedEvents} events replayed).`);
});

// Event Handlers
client.on('interactionCreate', (interaction) => {
  handleInteraction(client, interaction);
});

client.on('voiceStateUpdate', (oldState, newState) => {
  handleVoiceStateUpdate(client, oldState, newState);
});

client.on('messageCreate', (message) => {
  handleMessageCreate(client, message);
});

// Initialize AI Moderation Action Subscriber
initModerationActionSubscriber(client);

async function initializeServices() {
  try {
    await database.authenticate();
    logger.info('[Boot] Database connected');
  } catch (err) {
    logger.warn(`[Boot] Database unavailable: ${err.message}`);
  }

  try {
    await redis.ping();
    logger.info('[Boot] Redis connected');
  } catch (err) {
    logger.warn(`[Boot] Redis unavailable: ${err.message}`);
  }

  try {
    await i18n.init();
    logger.info('[Boot] i18n initialized');
  } catch (err) {
    logger.warn(`[Boot] i18n init failed: ${err.message}`);
  }

  try {
    await aiService.init();
  } catch (err) {
    logger.warn(`[Boot] AI service init failed: ${err.message}`);
  }
}

await initializeServices();

// Load commands before logging into Discord
await loadCommands(client);

// Login
client.login(env.DISCORD_TOKEN).catch((err) => {
  console.error('❌ FATAL: Bot failed to log in to Discord. Check your DISCORD_TOKEN in .env:');
  console.error(err.message);
  process.exit(1);
});

export default client;

import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js';
import { env } from '../../../packages/config/src/env.js';
import { redis } from '../../../packages/redis/index.js';
import { handleInteraction } from './handlers/interactionHandler.js';
import { handleVoiceUpdate } from '../../../packages/systems/voice/voiceSystem.js';
import { loadCommands } from './handlers/commandHandler.js';
import { handleMessageCreate } from './events/messageCreate.js';
import { initModerationActionSubscriber } from './handlers/actionSubscriber.js';
import logger from '../../../packages/logger/index.js';
import sequelize from '../../../packages/database/index.js';
import i18n from '../../../packages/utils/i18n.js';
import aiService from '../../../packages/systems/ai/aiService.js';
import { startBackgroundTasks } from '../../../packages/systems/backgroundTasks.js';
import { handleMemberJoin, handleMemberLeave } from '../../../packages/systems/welcome/welcomeSystem.js';
import { trackInvite, markLeft } from '../../../packages/systems/logging/inviteTracker.js';
import { runBootHealthCheck as runDependencyHealthCheck } from '../../../packages/systems/health/healthCheck.js';
import { onChannelDelete, onRoleDelete, onGuildBanAdd, onGuildMemberRemove } from '../../../packages/systems/antinuke/antiNuke.js';
import { trackJoin } from '../../../packages/systems/antinuke/antiRaid.js';
import { handleReactionRole } from '../../../packages/systems/reactionroles/reactionRoleHandler.js';
import { logMemberJoin, logMemberLeave, logMemberUpdate, logChannelCreate, logChannelDelete, logRoleCreate, logRoleDelete, logBanAdd, logBanRemove, logMessageDelete, logMessageEdit, logGhostPing, logVoiceUpdate } from '../../../packages/systems/logging/loggingSystem.js';
import { startEmbeddedWorker } from '../../ai-worker/src/embedded.js';

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

// Shared Redis connection for cooldowns and cache lookups
client.redis = redis;

// Shared services (database, localization, AI, logging)
client.logger = logger;
client.db = sequelize;
client.i18n = i18n;
client.ai = aiService;

// Online confirmation
client.once('clientReady', () => {
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

client.on('voiceStateUpdate', async (oldState, newState) => {
  try { await handleVoiceUpdate(client, oldState, newState); } catch (err) { client.logger?.error?.('[TempVoice] voice update:', err.message); }
  try { await logVoiceUpdate(client, oldState, newState); } catch (err) { client.logger?.error?.('[Logging] voice update:', err.message); }
});

client.on('messageCreate', (message) => {
  handleMessageCreate(client, message);
});

// Guild lifecycle handlers — persistent listeners, each subsystem isolated so a single
// failure can never take the process down.
client.on('guildMemberAdd', async (member) => {
  try { await handleMemberJoin(client, member); } catch (err) { client.logger?.error?.('[Welcome] join:', err.message); }
  try { await trackInvite(client, member); } catch (err) { client.logger?.error?.('[Invites] track:', err.message); }
  try { await logMemberJoin(client, member); } catch (err) { client.logger?.error?.('[Logging] member join:', err.message); }
  try { await trackJoin(client, member); } catch (err) { client.logger?.error?.('[AntiRaid] join tracking:', err.message); }
});

client.on('guildMemberRemove', async (member) => {
  try { await handleMemberLeave(client, member); } catch (err) { client.logger?.error?.('[Welcome] leave:', err.message); }
  try { await onGuildMemberRemove(client, member); } catch (err) { client.logger?.error?.('[AntiNuke] kick:', err.message); }
  try { await markLeft(client, member); } catch (err) { client.logger?.error?.('[Invites] markLeft:', err.message); }
  try { await logMemberLeave(client, member); } catch (err) { client.logger?.error?.('[Logging] member leave:', err.message); }
});

client.on('channelDelete', async (channel) => {
  try { await onChannelDelete(client, channel); } catch (err) { client.logger?.error?.('[AntiNuke] channel delete:', err.message); }
  try { await logChannelDelete(client, channel); } catch (err) { client.logger?.error?.('[Logging] channel delete:', err.message); }
});

client.on('roleDelete', async (role) => {
  try { await onRoleDelete(client, role); } catch (err) { client.logger?.error?.('[AntiNuke] role delete:', err.message); }
  try { await logRoleDelete(client, role); } catch (err) { client.logger?.error?.('[Logging] role delete:', err.message); }
});

client.on('guildBanAdd', async (ban) => {
  try { await onGuildBanAdd(client, ban); } catch (err) { client.logger?.error?.('[AntiNuke] ban add:', err.message); }
  try { await logBanAdd(client, ban); } catch (err) { client.logger?.error?.('[Logging] ban add:', err.message); }
});

client.on('guildBanRemove', async (ban) => {
  try { await logBanRemove(client, ban); } catch (err) { client.logger?.error?.('[Logging] ban remove:', err.message); }
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
  try { await logMemberUpdate(client, oldMember, newMember); } catch (err) { client.logger?.error?.('[Logging] member update:', err.message); }
});

client.on('channelCreate', async (channel) => {
  try { await logChannelCreate(client, channel); } catch (err) { client.logger?.error?.('[Logging] channel create:', err.message); }
});

client.on('roleCreate', async (role) => {
  try { await logRoleCreate(client, role); } catch (err) { client.logger?.error?.('[Logging] role create:', err.message); }
});

client.on('messageDelete', async (message) => {
  try { await logMessageDelete(client, message); } catch (err) { client.logger?.error?.('[Logging] message delete:', err.message); }
  try {
    // logGhostPing(c, m, mentions) needs the mentions snapshot: only invoke it when the
    // deleted message actually pinged someone (the logger falls back to a 'role(s)' label otherwise).
    const mentions = message.mentions;
    const hadPing = Boolean(mentions && (mentions.users.size || mentions.roles.size || mentions.everyone));
    if (hadPing && !message.author?.bot) await logGhostPing(client, message, mentions);
  } catch (err) { client.logger?.error?.('[Logging] ghost ping:', err.message); }
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
  try {
    // logMessageEdit reads n.content / n.channel.id, which partial payloads omit — hydrate first.
    const updated = newMessage.partial ? await newMessage.fetch() : newMessage;
    await logMessageEdit(client, oldMessage, updated);
  } catch (err) { client.logger?.error?.('[Logging] message edit:', err.message); }
});

// Reaction roles — Partials.Reaction/Message are enabled; the handler hydrates partials itself.
client.on('messageReactionAdd', async (reaction, user) => {
  try { await handleReactionRole(client, reaction, user, true); } catch (err) { (client.logger?.error ?? console.error)('[ReactionRole] reaction add:', err.message); }
});

client.on('messageReactionRemove', async (reaction, user) => {
  try { await handleReactionRole(client, reaction, user, false); } catch (err) { (client.logger?.error ?? console.error)('[ReactionRole] reaction remove:', err.message); }
});

// Initialize async services before any code paths depend on them (non-fatal on failure)
try {
  await i18n.init();
} catch (err) {
  console.error('⚠️ i18n init failed:', err.message);
}

try {
  await aiService.init();
} catch (err) {
  console.error('⚠️ AI service init failed:', err.message);
}

// ── Boot-time dependency health check ──────────────────────────────
// Surfaces broken wiring (database down, Redis down, missing AI provider)
// IMMEDIATELY in the logs instead of letting every command fail later on.
// Strictly non-fatal: every probe is individually try/caught, nothing here
// calls process.exit and the bot always continues booting. The probe runs
// alongside the command loader so a slow dependency cannot delay the boot.
const bootHealthCheck = runDependencyHealthCheck(client).catch((err) => {
  client.logger?.warn?.('[Health] Boot probe failed:', err?.message);
});

// Initialize AI Moderation Action Subscriber
initModerationActionSubscriber(client);

// Load commands before logging into Discord
await loadCommands(client);

// Command registry health signal — reported after loadCommands so the
// count reflects the real registry.
try {
  const commandCount = client.commands?.size ?? 0;
  client.logger?.info?.(`[Health] Commands loaded: ${commandCount}`);
  if (!commandCount) {
    client.logger?.warn?.('[Health] Commands loaded: 0 — no slash commands were registered');
  }
} catch (err) {
  client.logger?.warn?.('[Health] Command count failed:', err?.message);
}

// Make sure the health probe finished so its lines are always in the boot log.
await bootHealthCheck;

// Embedded AI moderation worker — the Docker image runs the bot only, so the
// queue consumer has to live in this process. Set AI_WORKER_STANDALONE=true
// on hosts that run `npm run start:worker` as a separate service.
if (process.env.AI_WORKER_STANDALONE === 'true') {
  console.log('ℹ️ [AI Worker] AI_WORKER_STANDALONE=true — standalone worker expected, embedded worker disabled.');
} else {
  try {
    startEmbeddedWorker(client);
  } catch (err) {
    console.warn('⚠️ [AI Worker] Failed to start the embedded AI worker:', err?.message);
  }
}

// Voice session tracking state consumed by backgroundTasks (Map<`${userId}:${guildId}`, joinedAtMs>)
client.voiceSessions = new Map();

// Start cron jobs (voice XP, birthdays, giveaways, tickets, stats, ...) + voice session XP tracking
try {
  startBackgroundTasks(client);
} catch (err) {
  client.logger?.error?.('[Boot] Failed to start background tasks:', err.message);
}

// Login
if (!env.DISCORD_TOKEN || env.DISCORD_TOKEN.includes('placeholder') || env.DISCORD_TOKEN === 'your_discord_bot_token_here') {
  console.warn('⚠️ A valid DISCORD_TOKEN was not configured in .env.');
  console.warn('ℹ️ Running Aura Bot in offline development mode. Provide a valid DISCORD_TOKEN to connect to Gateway.');
} else {
  client.login(env.DISCORD_TOKEN).catch((err) => {
    console.error('❌ FATAL: Bot failed to log in to Discord. Check your DISCORD_TOKEN in .env:');
    console.error(err.message);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });
}

export default client;

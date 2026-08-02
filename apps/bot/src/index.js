// ================================================================
//  @aura/bot — Discord Bot Service Entrypoint
// ================================================================

import 'dotenv/config';
import { Client, GatewayIntentBits, Partials, Collection, Options, PermissionFlagsBits } from 'discord.js';
import config, { env } from '@aura/config';
import database from '@aura/database';
import redis from '@aura/redis';
import logger from '@aura/logger';

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
  makeCache: Options.cacheWithLimits({
    MessageManager: 0,
    ThreadManager: 0,
    UserManager: 10,
    GuildMemberManager: 10,
    PresenceManager: 0,
    ReactionManager: 0,
  }),
});

client.commands = new Collection();
client.cooldowns = new Collection();
client.db = database;
client.redis = redis;
client.logger = logger;
client.config = config;

/**
 * Security: Least Privilege & Admin Permission Guard
 */
export function checkAdminPermission(interactionOrMessage) {
  const member = interactionOrMessage.member;
  if (!member) return false;
  return member.permissions.has(PermissionFlagsBits.Administrator) || member.permissions.has(PermissionFlagsBits.ManageGuild);
}

/**
 * Security: Redis Atomic Rate Limiter / Cooldown Guard
 */
export async function enforceCommandCooldown(userId, commandName, cooldownSeconds = 3) {
  const key = `cooldown:${userId}:${commandName}`;
  const limit = 1;
  const windowMs = cooldownSeconds * 1000;
  
  const { exceeded } = await redis.incrementBounded(key, limit, windowMs);
  return exceeded; // true if rate limited
}

async function boot() {
  try {
    logger.info('[Bot Service] Validating Environment & Bootstrapping...');
    logger.info(`[Bot Service] Connecting to Database & Redis...`);

    await redis.ping();
    logger.info('[Bot Service] Redis connection ready ✓');

    logger.info('[Bot Service] Logging into Discord Gateway...');
    await client.login(env.DISCORD_TOKEN);
    logger.info('[Bot Service] Logged in successfully as ' + client.user?.tag);

  } catch (err) {
    logger.error('[Bot Service] Critical Boot Error:', err.message);
    process.exit(1);
  }
}

client.on('ready', () => {
  logger.info(`[Bot Event] Gateway Ready | Serving ${client.guilds.cache.size} guilds.`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  // Security Check: Rate limiting per user
  const isRateLimited = await enforceCommandCooldown(interaction.user.id, interaction.commandName, 3);
  if (isRateLimited) {
    return interaction.reply({ content: '⚠️ You are sending commands too fast. Please wait a few seconds.', ephemeral: true });
  }

  // Security Check: Admin permission required for admin commands
  if (command.adminOnly && !checkAdminPermission(interaction)) {
    return interaction.reply({ content: '❌ You do not have permission to execute this administrative command.', ephemeral: true });
  }

  try {
    await command.execute(interaction, client);
  } catch (err) {
    logger.error(`[Command Error] Command ${interaction.commandName} failed:`, err);
    if (!interaction.replied) {
      await interaction.reply({ content: 'An internal error occurred while executing this command.', ephemeral: true });
    }
  }
});

boot();
export default client;

// ================================================================
//  Event: interactionCreate — High-Performance Command Router
// ================================================================
import { InteractionType, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { buildEmbed }      from '../../shared/utils/embedBuilder.js';
import config              from '../../shared/config/config.js';
import logger              from '../../shared/utils/logger.js';
import customization       from '../../shared/systems/customization/customizationSystem.js';

// Local cache for system handlers to avoid expensive dynamic imports
const handlerRegistry = new Map();


export default {
  name: 'interactionCreate',
  async execute(client, interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        return handleSlash(client, interaction);
      }
      if (interaction.isButton())                return handleButton(client, interaction);
      if (interaction.isStringSelectMenu() || interaction.isUserSelectMenu()) return handleSelect(client, interaction);
      if (interaction.type === InteractionType.ModalSubmit) return handleModal(client, interaction);
      if (interaction.isContextMenuCommand()) {
        const lang = await resolveLanguageFast(client, interaction.user.id, interaction.guildId);
        return handleContextMenu(client, interaction, lang);
      }
      if (interaction.isAutocomplete())          return handleAutocomplete(client, interaction);
    } catch (err) {
      logger.error('[InteractionCreate]', err);

      if (interaction.isAutocomplete()) {
        await interaction.respond([]).catch(() => {});
        return;
      }

      if (!interaction.isRepliable()) return;
      const fallback = {
        embeds: [buildEmbed({ type: 'error', description: '❌ Something went wrong while handling this interaction.' })],
        ephemeral: true
      };

      if (interaction.replied || interaction.deferred) await interaction.followUp(fallback).catch(() => {});
      else await interaction.reply(fallback).catch(() => {});
    }
  },
};

// ── Slash Commands ────────────────────────────────────────────
async function handleSlash(client, interaction) {
  const command = client.commands.get(interaction.commandName);
  if (!command) {
    return interaction.reply({
      embeds: [buildEmbed({ type: 'error', description: '❌ This command is not loaded on the bot. Re-deploy slash commands and try again.' })],
      ephemeral: true
    }).catch(() => {});
  }

  const coolKey = `cd:${interaction.user.id}:${interaction.commandName}`;
  const [lang, remaining, isRestricted] = await Promise.all([
    resolveLanguageFast(client, interaction.user.id, interaction.guildId),
    getCooldownRemainingFast(client, coolKey),
    checkRestrictionFast(client, interaction),
  ]);

  if (isRestricted) {
    return interaction.reply({
      embeds: [buildEmbed({ type: 'error', description: '❌ This command is restricted in this channel or has been disabled globally by administrators.' })],
      ephemeral: true,
    }).catch(() => {});
  }

  if (remaining > 0) {
    const secs = (remaining / 1000).toFixed(1);
    return interaction.reply({ 
      embeds: [buildEmbed({ type: 'warning', description: client.i18n.t('common.onCooldown', { time: `${secs}s` }, lang) })], 
      ephemeral: true 
    }).catch(() => {});
  }

  // Guild scope verification
  if (command.guildOnly && !interaction.guildId) {
    return interaction.reply({ embeds: [buildEmbed({ type: 'error', description: '❌ This command is restricted to servers.' })], ephemeral: true });
  }

  // Permission Checks (Member & Bot)
  if (command.userPermissions?.length && interaction.member) {
    const missing = command.userPermissions.filter(p => !interaction.member.permissions.has(p));
    if (missing.length) {
      return interaction.reply({ embeds: [buildEmbed({ type: 'error', description: client.i18n.t('common.noPermission', {}, lang) })], ephemeral: true });
    }
  }
  if (command.botPermissions?.length) {
    const botPerms = interaction.guild?.members?.me?.permissionsIn(interaction.channel);
    const missingBot = command.botPermissions.filter(p => !botPerms?.has(p));
    if (missingBot.length) {
      return interaction.reply({
        embeds: [buildEmbed({ type: 'error', description: '❌ I am missing required permissions to run this command in this channel.' })],
        ephemeral: true,
      }).catch(() => {});
    }
  }

  // Premium Tier Verification (Optimized with Timeout fallback)
  if (command.premiumTier > 0 && interaction.guildId) {
    let tier = 0;
    try {
      tier = await Promise.race([
        getGuildPremiumTier(client, interaction.guildId),
        new Promise(resolve => setTimeout(() => resolve(0), 1000))
      ]);
    } catch {}

    if (tier < command.premiumTier) {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('Unlock Premium').setStyle(ButtonStyle.Link).setURL(config.links?.premium || 'https://discord.gg/aura').setEmoji('⭐')
      );
      return interaction.reply({ 
        embeds: [buildEmbed({ type: 'premium', description: `⭐ Requires **Premium Tier ${command.premiumTier}**.\n\nBoost your server with Aura's elite features!`, footer: 'Support aura development.' })], 
        components: [row],
        ephemeral: true 
      }).catch(() => {});
    }
  }

  // Final Execution
  try {
    await command.execute(client, interaction, lang);
    if (command.cooldown > 0) {
      await client.redis.setex(coolKey, Math.ceil(command.cooldown / 1000), 'active');
    }
  } catch (err) {
    logger.error(`[/${interaction.commandName}]`, err);
    const errorReply = { embeds: [buildEmbed({ type: 'error', description: '❌ An internal error occurred while processing this command.' })], ephemeral: true };
    if (interaction.replied || interaction.deferred) await interaction.followUp(errorReply).catch(() => {});
    else await interaction.reply(errorReply).catch(() => {});
  }
}

/**
 * Optimized helper to fetch premium status from cache/database
 */
async function getGuildPremiumTier(client, guildId) {
  const cacheKey = `guild:premium:${guildId}`;
  const cached = await client.redis.get(cacheKey);
  if (cached !== null) return parseInt(cached);

  try {
    const s = await client.db.models.GuildSettings.findOne({ where: { guildId }, attributes: ['premiumTier'] });
    const tier = s?.premiumTier || 0;
    await client.redis.setex(cacheKey, 600, tier.toString()); // Cache for 10 minutes
    return tier;
  } catch {
    return 0; // Fallback to free tier on DB error
  }
}

async function resolveLanguageFast(client, userId, guildId) {
  try {
    return await Promise.race([
      client.i18n.resolveLanguage(client, userId, guildId),
      new Promise(resolve => setTimeout(() => resolve('en'), 800)),
    ]);
  } catch {
    return 'en';
  }
}

async function getCooldownRemainingFast(client, coolKey) {
  try {
    return await Promise.race([
      client.redis.pttl(coolKey),
      new Promise(resolve => setTimeout(() => resolve(-1), 800)),
    ]);
  } catch {
    return -1;
  }
}

async function checkRestrictionFast(client, interaction) {
  if (!interaction.guildId) return false;
  try {
    return await Promise.race([
      customization.isCommandRestricted(client, interaction.guildId, interaction.channelId, interaction.commandName),
      new Promise(resolve => setTimeout(() => resolve(false), 800)),
    ]);
  } catch {
    return false;
  }
}

// ── Component Handlers (with Registry Caching) ──────────────────
async function getHandler(prefix) {
  if (handlerRegistry.has(prefix)) return handlerRegistry.get(prefix);

  const paths = {
    ticket:   '../../shared/systems/tickets/ticketSystem.js',
    giveaway: '../../shared/systems/giveaway/giveawaySystem.js',
    poll:     '../../shared/systems/polls/pollSystem.js',
    apply:    '../../shared/systems/applications/applicationSystem.js',
    economy:  '../../shared/systems/economy/economySystem.js',
    ai:       '../commands/ai/aiCommands.js',
    games:    '../commands/games/gameCommands.js',
    staff:    '../commands/management/staff.js',
  };

  const path = paths[prefix];
  if (!path) return null;

  try {
    const mod = await import(path);
    handlerRegistry.set(prefix, mod);
    return mod;
  } catch (err) {
    logger.error(`[Registry] Failed to load ${prefix} from ${path}:`, err.message);
    return null;
  }
}

async function handleButton(client, interaction) {
  const [prefix, ...rest] = interaction.customId.split(':');
  
  // 🎙️ Handle TempVoice Interface
  if (prefix === 'tv') {
    const { handleTempVoiceInteraction } = await import('../../shared/systems/voice/voiceSystem.js');
    return handleTempVoiceInteraction(client, interaction);
  }

  const handler = await getHandler(prefix);
  if (handler?.handleButton) await handler.handleButton(client, interaction, rest.join(':'));
}

async function handleModal(client, interaction) {
  const [prefix, ...rest] = interaction.customId.split(':');
  const handler = await getHandler(prefix);
  if (handler?.handleModal) await handler.handleModal(client, interaction, rest.join(':'));
}

async function handleSelect(client, interaction) {
  const [prefix, ...rest] = interaction.customId.split(':');
  const handler = await getHandler(prefix);
  if (handler?.handleSelectMenu) await handler.handleSelectMenu(client, interaction, rest.join(':'));
}

// ── Shared Handlers ───────────────────────────────────────────
async function handleContextMenu(client, interaction, lang) {
  const cmd = client.commands.get(interaction.commandName);
  if (cmd?.execute) await cmd.execute(client, interaction, lang).catch(err => logger.error('[ContextMenu]', err));
}

async function handleAutocomplete(client, interaction) {
  const cmd = client.commands.get(interaction.commandName);
  if (cmd?.autocomplete) await cmd.autocomplete(client, interaction).catch(() => {});
}

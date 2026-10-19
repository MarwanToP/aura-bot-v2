// ================================================================
//  Event: interactionCreate — High-Performance Command Router
// ================================================================
import { InteractionType, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { buildEmbed }      from '../../shared/utils/embedBuilder.js';
import config              from '../../shared/config/config.js';
import logger              from '../../shared/utils/logger.js';
import customization       from '../../shared/systems/customization/customizationSystem.js';
import { checkCommandPermissions } from '../../shared/utils/permissions.js';

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
      if (interaction.isAnySelectMenu())           return handleSelect(client, interaction);
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
        flags: MessageFlags.Ephemeral
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
      flags: MessageFlags.Ephemeral
    }).catch(() => {});
  }

  // Auto-defer if command requests deferral or takes time
  if (command.defer) {
    await interaction.deferReply({ flags: command.ephemeral ? MessageFlags.Ephemeral : undefined }).catch(() => {});
  }

  const coolKey = `cd:${interaction.user.id}:${interaction.commandName}`;
  const [lang, remaining, isRestricted] = await Promise.all([
    resolveLanguageFast(client, interaction.user.id, interaction.guildId),
    getCooldownRemainingFast(client, coolKey),
    checkRestrictionFast(client, interaction),
  ]);

  const sendResponse = async (payload) => {
    if (interaction.deferred || interaction.replied) {
      return interaction.editReply(payload).catch(() => {});
    }
    return interaction.reply(payload).catch(() => {});
  };

  if (isRestricted) {
    return sendResponse({
      embeds: [buildEmbed({ type: 'error', description: '❌ This command is restricted in this channel or has been disabled globally by administrators.' })],
      flags: MessageFlags.Ephemeral,
    });
  }

  if (remaining > 0) {
    const secs = (remaining / 1000).toFixed(1);
    return sendResponse({ 
      embeds: [buildEmbed({ type: 'warning', description: client.i18n.t('common.onCooldown', { time: `${secs}s` }, lang) })], 
      flags: MessageFlags.Ephemeral 
    });
  }

  // Guild scope verification
  if (command.guildOnly && !interaction.guildId) {
    return sendResponse({ embeds: [buildEmbed({ type: 'error', description: '❌ This command is restricted to servers.' })], flags: MessageFlags.Ephemeral });
  }

  // Command Settings (enabled/role restrictions)
  const cmdSettings = await client.db?.models?.CommandSettings?.findOne({
    where: { guildId: interaction.guildId, commandName: interaction.commandName },
  });
  if (cmdSettings) {
    if (!cmdSettings.enabled) {
      return sendResponse({
        embeds: [buildEmbed({ type: 'error', description: '❌ This command has been disabled by administrators.' })],
        flags: MessageFlags.Ephemeral,
      });
    }
    if (Array.isArray(cmdSettings.allowedRoles) && cmdSettings.allowedRoles.length > 0) {
      const memberRoles = interaction.member?.roles?.cache?.map(r => r.id) || [];
      const hasAllowed = cmdSettings.allowedRoles.some(rid => memberRoles.includes(rid));
      if (!hasAllowed) {
        return sendResponse({
          embeds: [buildEmbed({ type: 'error', description: '❌ You do not have the required role to use this command.' })],
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  }

  // Permission Checks (Member & Bot) — shared gate, same as prefix path
  const perm = checkCommandPermissions(command, {
    member: interaction.member,
    guild: interaction.guild,
    channel: interaction.channel,
  });
  if (!perm.ok) {
    const message = perm.kind === 'bot'
      ? '❌ I am missing required permissions to run this command in this channel.'
      : client.i18n.t('common.noPermission', {}, lang);
    return sendResponse({ embeds: [buildEmbed({ type: 'error', description: message })], flags: MessageFlags.Ephemeral });
  }

  // Premium Tier Verification (Optimized with Timeout fallback)
  if (command.premiumTier > 0 && interaction.guildId) {
    let tier = 0;
    try {
      tier = await Promise.race([
        getGuildPremiumTier(client, interaction.guildId),
        new Promise(resolve => setTimeout(() => resolve(0), 400))
      ]);
    } catch {}

    if (tier < command.premiumTier) {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('Unlock Premium').setStyle(ButtonStyle.Link).setURL(config.links?.premium || 'https://discord.gg/aura').setEmoji('⭐')
      );
      return sendResponse({ 
        embeds: [buildEmbed({ type: 'premium', description: `⭐ Requires **Premium Tier ${command.premiumTier}**.\n\nBoost your server with Aura's elite features!`, footer: 'Support aura development.' })], 
        components: [row],
        flags: MessageFlags.Ephemeral 
      });
    }
  }

  // Final Execution
  try {
    await command.execute(client, interaction, lang);
    if (command.cooldown > 0 && client.redis?.status === 'ready') {
      await client.redis.setex(coolKey, command.cooldown || 3, 'active').catch(() => {});
    }
  } catch (err) {
    logger.error(`[/${interaction.commandName}]`, err);
    const errorReply = { embeds: [buildEmbed({ type: 'error', description: '❌ An internal error occurred while processing this command.' })], flags: MessageFlags.Ephemeral };
    await sendResponse(errorReply);
  }
}

/**
 * Optimized helper to fetch premium status from cache/database
 */
async function getGuildPremiumTier(client, guildId) {
  if (!client.redis || client.redis.status !== 'ready') return 0;
  const cacheKey = `guild:premium:${guildId}`;
  try {
    const cached = await client.redis.get(cacheKey);
    if (cached !== null) return parseInt(cached);
  } catch {}

  try {
    const s = await client.db?.models?.GuildSettings?.findOne({ where: { guildId }, attributes: ['premiumTier'] });
    const tier = s?.premiumTier || 0;
    if (client.redis?.status === 'ready') {
      await client.redis.setex(cacheKey, 600, tier.toString()).catch(() => {});
    }
    return tier;
  } catch {
    return 0; // Fallback to free tier on DB error
  }
}

async function resolveLanguageFast(client, userId, guildId) {
  try {
    if (!client.i18n) return 'en';
    return await Promise.race([
      client.i18n.resolveLanguage(client, userId, guildId),
      new Promise(resolve => setTimeout(() => resolve('en'), 400)),
    ]);
  } catch {
    return 'en';
  }
}

async function getCooldownRemainingFast(client, coolKey) {
  try {
    if (!client.redis || client.redis.status !== 'ready') return -1;
    return await Promise.race([
      client.redis.pttl(coolKey),
      new Promise(resolve => setTimeout(() => resolve(-1), 400)),
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
      new Promise(resolve => setTimeout(() => resolve(false), 400)),
    ]);
  } catch {
    return false;
  }
}

// ── Component Handlers (with Registry Caching) ──────────────────
const COMPONENT_REGISTRY = {
  ticket:   '../../../../packages/systems/tickets/ticketSystem.js',
  csat:     '../../../../packages/systems/tickets/ticketSystem.js',
  giveaway: '../../../../packages/systems/giveaway/giveawaySystem.js',
  poll:     '../../../../packages/systems/polls/pollSystem.js',
  apply:    '../../../../packages/systems/applications/applicationSystem.js',
  economy:  '../../../../packages/systems/economy/economySystem.js',
  ai:       '../commands/ai/aiCommands.js',
  games:    '../commands/games/gameCommands.js',
  staff:    '../commands/management/staff.js',
  suggest:  '../commands/utility/suggest.js',
  verify_button: '../commands/utility/verify.js',
};

async function getHandler(prefix) {
  if (handlerRegistry.has(prefix)) return handlerRegistry.get(prefix);

  const path = COMPONENT_REGISTRY[prefix];
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

/**
 * Tolerant component dispatch. Resolves the registry module for the customId
 * prefix and invokes the requested handler with the rest of the customId.
 * Unknown prefixes and modules without the needed handler are logged (never
 * silently dropped) and otherwise ignored — no user-facing reply.
 */
async function dispatchComponent(client, interaction, prefix, rest, handlerName) {
  const customId = interaction.customId;
  const handler = await getHandler(prefix);

  if (!handler) {
    const known = Object.prototype.hasOwnProperty.call(COMPONENT_REGISTRY, prefix);
    client.logger?.warn?.(known
      ? `[Components] Failed to load module for prefix '${prefix}' (customId: '${customId}')`
      : `[Components] Unknown customId prefix '${prefix}' (customId: '${customId}')`);
    return;
  }
  if (typeof handler[handlerName] !== 'function') {
    client.logger?.warn?.(`[Components] Module for '${prefix}' has no ${handlerName} (customId: '${customId}')`);
    return;
  }
  await handler[handlerName](client, interaction, rest.join(':'));
}

async function handleButton(client, interaction) {
  const [prefix, ...rest] = interaction.customId.split(':');
  
  // 🎙️ Handle TempVoice Interface
  if (prefix === 'tv') {
    const { handleTempVoiceInteraction } = await import('../../../../packages/systems/voice/voiceSystem.js');
    return handleTempVoiceInteraction(client, interaction);
  }

  await dispatchComponent(client, interaction, prefix, rest, 'handleButton');
}

async function handleModal(client, interaction) {
  const [prefix, ...rest] = interaction.customId.split(':');
  await dispatchComponent(client, interaction, prefix, rest, 'handleModal');
}

async function handleSelect(client, interaction) {
  const [prefix, ...rest] = interaction.customId.split(':');
  await dispatchComponent(client, interaction, prefix, rest, 'handleSelectMenu');
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

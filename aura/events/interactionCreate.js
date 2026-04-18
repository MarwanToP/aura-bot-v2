// ================================================================
//  Event: interactionCreate — High-Performance Command Router
// ================================================================
import { InteractionType, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { buildEmbed }      from '../../shared/utils/embedBuilder.js';
import config              from '../../config/config.js';
import logger              from '../../shared/utils/logger.js';

// Local cache for system handlers to avoid expensive dynamic imports
const handlerRegistry = new Map();

import customization from '../../shared/systems/customization/customizationSystem.js';

// Local cache for system handlers to avoid expensive dynamic imports
const handlerRegistry = new Map();

export default {
  name: 'interactionCreate',
  async execute(client, interaction) {
    try {
      // 1. Resolve language ONCE per interaction lifecycle
      const lang = await client.i18n.resolveLanguage(client, interaction.user.id, interaction.guildId);
      
      if (interaction.isChatInputCommand()) {
        // Enforce Neural Blacklists & Restrictions
        if (interaction.guildId) {
          const isRestricted = await customization.isCommandRestricted(client, interaction.guildId, interaction.channelId, interaction.commandName);
          if (isRestricted) {
            return interaction.reply({ 
              embeds: [buildEmbed({ type: 'error', description: '❌ This command is restricted in this channel or has been disabled globally by administrators.' })], 
              ephemeral: true 
            });
          }
        }
        return handleSlash(client, interaction, lang);
      }
      if (interaction.isButton())                return handleButton(client, interaction);
      if (interaction.isStringSelectMenu() || interaction.isUserSelectMenu()) return handleSelect(client, interaction);
      if (interaction.type === InteractionType.ModalSubmit) return handleModal(client, interaction);
      if (interaction.isContextMenuCommand())    return handleContextMenu(client, interaction, lang);
      if (interaction.isAutocomplete())          return handleAutocomplete(client, interaction);
    } catch (err) {
      logger.error('[InteractionCreate]', err);
    }
  },
};

// ── Slash Commands ────────────────────────────────────────────
async function handleSlash(client, interaction, lang) {
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  // Optimized Cooldown Check (Single Redis PTTL call)
  const coolKey = `cd:${interaction.user.id}:${interaction.commandName}`;
  const remaining = await client.redis.pttl(coolKey); // -2 if key doesn't exist, -1 if no TTL

  if (remaining > 0) {
    const secs = (remaining / 1000).toFixed(1);
    return interaction.reply({ 
      embeds: [buildEmbed({ type: 'warning', description: client.i18n.t('common.onCooldown', { time: `${secs}s` }, lang) })], 
      ephemeral: true 
    });
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

  // Premium Tier Verification (Optimized with Redis Caching)
  if (command.premiumTier > 0 && interaction.guildId) {
    const tier = await getGuildPremiumTier(client, interaction.guildId);
    if (tier < command.premiumTier) {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('Unlock Premium').setStyle(ButtonStyle.Link).setURL(config.links?.premium || 'https://example.com/premium').setEmoji('⭐')
      );
      return interaction.reply({ 
        embeds: [buildEmbed({ type: 'premium', description: `⭐ Requires **Premium Tier ${command.premiumTier}**.\n\nBoost your server with Aura's elite features!`, footer: 'Support aura development.' })], 
        components: [row],
        ephemeral: true 
      });
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

// ── Component Handlers (with Registry Caching) ──────────────────
async function getHandler(prefix) {
  if (handlerRegistry.has(prefix)) return handlerRegistry.get(prefix);

  const paths = {
    ticket:   '../../shared/systems/tickets/ticketSystem.js',
    giveaway: '../../shared/systems/giveaway/giveawaySystem.js',
    poll:     '../../shared/systems/polls/pollSystem.js',
    apply:    '../../shared/systems/applications/applicationSystem.js',
  };

  const path = paths[prefix];
  if (!path) return null;

  try {
    const mod = await import(path);
    handlerRegistry.set(prefix, mod);
    return mod;
  } catch (err) {
    logger.error(`[Registry] Failed to load ${prefix}:`, err.message);
    return null;
  }
}

async function handleButton(client, interaction) {
  const [prefix, ...rest] = interaction.customId.split(':');
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

// ================================================================
//  Event: interactionCreate — Component Router
//
//  Slash commands are handled by the LIVE router
//  (apps/bot/src/handlers/interactionHandler.js). This router owns the
//  component interactions only: buttons, select menus, modals, context menus
//  and autocomplete.
// ================================================================
import { InteractionType, MessageFlags } from 'discord.js';
import { buildEmbed }      from '../../shared/utils/embedBuilder.js';
import logger              from '../../shared/utils/logger.js';
import { checkCommandPermissions, permissionFailureMessage } from '../../shared/utils/permissions.js';

// Local cache for system handlers to avoid expensive dynamic imports
const handlerRegistry = new Map();


export default {
  name: 'interactionCreate',
  async execute(client, interaction) {
    try {
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

// Prefixes whose interactions are handled by a COMMAND-LOCAL collector
// (session-scoped and owner-checked, e.g. the /tpanel configurator). The
// global router must ignore them — otherwise every panel click logs a
// bogus "unknown customId prefix" warning.
const SELF_HANDLED_PREFIXES = new Set(['tpanel']);

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
  if (SELF_HANDLED_PREFIXES.has(prefix)) return;
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
  if (!cmd?.execute) return;

  // Shared permission gate — same helper and same branded message as the
  // slash router, so the two paths can never drift apart.
  const cp = checkCommandPermissions(cmd, {
    member: interaction.member,
    guild: interaction.guild,
    channel: interaction.channel,
  });
  if (!cp.ok) {
    const message = permissionFailureMessage(cp);
    return interaction.reply({
      embeds: [buildEmbed({ type: 'error', description: message })],
      flags: MessageFlags.Ephemeral,
    }).catch(() => {});
  }

  await cmd.execute(client, interaction, lang).catch(err => logger.error('[ContextMenu]', err));
}

async function handleAutocomplete(client, interaction) {
  const cmd = client.commands.get(interaction.commandName);
  if (cmd?.autocomplete) await cmd.autocomplete(client, interaction).catch(() => {});
}

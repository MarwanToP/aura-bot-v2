// ================================================================
//  Admin Command — /tpanel
//  Visual Ticket Configurator.
//
//  This panel is a real, persisted view of the ticket system. It
//  reads and writes EXACTLY the same GuildSettings columns that
//  `/settings tickets` writes, so both surfaces can never drift:
//
//    • ticketEnabled       — boolean, master switch of the ticket system
//    • ticketCategoryId    — channel id of the category new tickets spawn in
//    • ticketSupportRoles  — array of role ids allowed to work a ticket
//    • ticketLogChannelId  — channel id that receives ticket transcripts
//
//  Every control writes to Postgres and the panel is re-rendered with
//  the new state, so the message always shows the live configuration.
// ================================================================
import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ChannelType,
  MessageFlags,
} from 'discord.js';
import { buildEmbed } from '../../../../../packages/utils/embedBuilder.js';
import { formatMissingBotPermissions } from '../../../../../packages/utils/permissions.js';

// Discord component limits (developers/docs/interactions/components)
const MAX_SELECT_OPTIONS = 25;
const MAX_ROW_COMPONENTS = 5;
const MAX_ACTION_ROWS = 5;

// The panel is interactive for a bounded window; after that the controls
// are removed from the message so the panel can never go stale.
const COLLECTOR_TIME = 120000;

// Custom IDs are namespaced so they can never collide with another
// panel (the global component router only dispatches known prefixes).
const CUSTOM_IDS = {
  toggle:     'tpanel:toggle',
  category:   'tpanel:category',
  log:        'tpanel:log',
  roleAdd:    'tpanel:role_add',
  roleRemove: 'tpanel:role_remove',
};

// Channel types that can receive a ticket transcript.
const LOG_CHANNEL_TYPES = [ChannelType.GuildText, ChannelType.GuildAnnouncement];

// ── Small helpers ──────────────────────────────────────────────
const truncate = (text, max) => {
  const value = String(text ?? '');
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
};

const isFunction = (value) => typeof value === 'function';

/**
 * The guild the command runs in. `interaction.guild` is authoritative,
 * the client cache is the fallback for partial interactions.
 */
function guildOf(client, interaction) {
  return interaction?.guild ?? client?.guilds?.cache?.get?.(interaction?.guildId) ?? null;
}

/**
 * Permission pre-flight. The ticket engine creates and manages ticket
 * channels, so the bot needs Manage Channels — without it the controls
 * would look usable but could never work.
 *
 * Returns the list of missing permission bits (empty when the bot may
 * proceed). When the permissions cannot be resolved at all the check is
 * skipped rather than blocking the admin on a false negative.
 */
function missingBotPermissions(interaction) {
  const me = interaction?.guild?.members?.me;
  let perms = null;
  try {
    perms = isFunction(me?.permissionsIn) ? me.permissionsIn(interaction.channel) : me?.permissions;
  } catch {
    perms = null;
  }
  if (!perms || !isFunction(perms.has)) return [];
  return [PermissionFlagsBits.ManageChannels].filter((bit) => !perms.has(bit));
}

/**
 * Load (and create when missing) the guild settings row.
 * findOrCreate is mandatory: an update on a missing row is a silent no-op.
 */
async function loadSettings(client, guildId) {
  const model = client?.db?.models?.GuildSettings;
  if (!model || !isFunction(model.findOrCreate)) return null;
  const [settings] = await model.findOrCreate({
    where: { guildId },
    defaults: { ticketEnabled: false },
  });
  return settings ?? null;
}

/**
 * Channels of the given types. The guild cache is used first; when it
 * holds nothing of that type the API is asked once. A failed fetch is
 * not fatal — the matching select is simply not rendered.
 */
async function collectChannels(guild, types) {
  const wanted = new Set(types);
  const cached = [...(guild?.channels?.cache?.values?.() ?? [])].filter((ch) => ch && wanted.has(ch.type));
  if (cached.length) return cached;
  try {
    const fetched = await guild?.channels?.fetch?.();
    if (fetched && isFunction(fetched.values)) {
      return [...fetched.values()].filter((ch) => ch && wanted.has(ch.type));
    }
  } catch {
    /* cold cache + failed fetch → the select is omitted */
  }
  return cached;
}

/**
 * Roles the bot is able to see and hand out: not @everyone, not
 * integration-managed and strictly below the bot's highest role.
 */
function collectAssignableRoles(guild) {
  const roles = [...(guild?.roles?.cache?.values?.() ?? [])].filter(Boolean);
  const everyoneId = guild?.id;
  const botHighest = guild?.members?.me?.roles?.highest?.position;
  return roles.filter((role) => {
    if (!role?.id) return false;
    if (role.id === everyoneId) return false;
    if (role.managed) return false;
    if (typeof botHighest === 'number' && typeof role.position === 'number' && role.position >= botHighest) return false;
    return true;
  });
}

/**
 * The support roles that are currently configured. Roles that are not in
 * the cache any more are still listed (by id) so they can be removed.
 */
function collectConfiguredRoles(guild, ids) {
  return ids.map((id) => {
    const role = guild?.roles?.cache?.get?.(id);
    return { id: String(id), name: role?.name ?? `Role ${id}` };
  });
}

// ── Panel rendering ────────────────────────────────────────────
function buildPanelEmbed(settings) {
  const enabled = Boolean(settings.ticketEnabled);
  const roles = Array.isArray(settings.ticketSupportRoles) ? settings.ticketSupportRoles : [];
  return buildEmbed({
    type: enabled ? 'success' : 'primary',
    title: '🎫 Ticket Configurator',
    description: 'Live ticket system configuration.\nEvery change below is written to the server settings instantly.',
    fields: [
      { name: '⚙️ Ticket System',  value: enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
      { name: '📁 Ticket Category', value: settings.ticketCategoryId ? `<#${settings.ticketCategoryId}>` : '❌ Not set', inline: true },
      { name: '📋 Log Channel',    value: settings.ticketLogChannelId ? `<#${settings.ticketLogChannelId}>` : '❌ Not set', inline: true },
      { name: '👥 Support Roles',  value: roles.length ? roles.map((id) => `<@&${id}>`).join(' ') : '❌ Not set', inline: false },
    ],
    footer: 'Aura Ticket Engine • saved automatically',
    timestamp: true,
  });
}

function buildCategorySelect(categories) {
  if (!categories?.length) return null;
  const options = categories.slice(0, MAX_SELECT_OPTIONS).map((ch) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(truncate(ch?.name || `Category ${ch?.id}`, 100))
      .setValue(String(ch?.id))
      .setDescription(truncate(`ID: ${ch?.id}`, 100)),
  );
  return new StringSelectMenuBuilder()
    .setCustomId(CUSTOM_IDS.category)
    .setPlaceholder('📁 Choose the ticket category…')
    .setMaxValues(1)
    .addOptions(options);
}

function buildLogSelect(channels) {
  if (!channels?.length) return null;
  const options = channels.slice(0, MAX_SELECT_OPTIONS).map((ch) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(truncate(ch?.name || `Channel ${ch?.id}`, 100))
      .setValue(String(ch?.id))
      .setDescription(truncate(`ID: ${ch?.id}`, 100)),
  );
  return new StringSelectMenuBuilder()
    .setCustomId(CUSTOM_IDS.log)
    .setPlaceholder('📋 Choose the ticket log channel…')
    .setMaxValues(1)
    .addOptions(options);
}

function buildRoleAddSelect(roles) {
  if (!roles?.length) return null;
  const options = roles.slice(0, MAX_SELECT_OPTIONS).map((role) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(truncate(role?.name || `Role ${role?.id}`, 100))
      .setValue(String(role?.id))
      .setDescription(truncate(`ID: ${role?.id}`, 100)),
  );
  return new StringSelectMenuBuilder()
    .setCustomId(CUSTOM_IDS.roleAdd)
    .setPlaceholder('➕ Add a support role…')
    .setMaxValues(1)
    .addOptions(options);
}

function buildRoleRemoveSelect(roles) {
  if (!roles?.length) return null;
  const options = roles.slice(0, MAX_SELECT_OPTIONS).map((role) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(truncate(role?.name || `Role ${role?.id}`, 100))
      .setValue(String(role?.id))
      .setDescription(truncate(`ID: ${role?.id}`, 100)),
  );
  return new StringSelectMenuBuilder()
    .setCustomId(CUSTOM_IDS.roleRemove)
    .setPlaceholder('➖ Remove a support role…')
    .setMaxValues(1)
    .addOptions(options);
}

/**
 * Build the action rows of the panel. A select whose option list would
 * be empty is not rendered at all (Discord rejects empty selects).
 */
function buildPanelRows(settings, data) {
  const rows = [];

  // 1 — master switch
  rows.push(new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(CUSTOM_IDS.toggle)
      .setLabel(settings.ticketEnabled ? 'Disable tickets' : 'Enable tickets')
      .setStyle(settings.ticketEnabled ? ButtonStyle.Danger : ButtonStyle.Success)
      .setEmoji(settings.ticketEnabled ? '⛔' : '✅'),
  ));

  // 2 — ticket category + ticket log channel
  const channelComponents = [
    buildCategorySelect(data.categories),
    buildLogSelect(data.logChannels),
  ].filter(Boolean);
  if (channelComponents.length) {
    rows.push(new ActionRowBuilder().addComponents(...channelComponents.slice(0, MAX_ROW_COMPONENTS)));
  }

  // 3 — support roles (add / remove)
  const roleComponents = [
    buildRoleAddSelect(data.addableRoles),
    buildRoleRemoveSelect(data.configuredRoles),
  ].filter(Boolean);
  if (roleComponents.length) {
    rows.push(new ActionRowBuilder().addComponents(...roleComponents.slice(0, MAX_ROW_COMPONENTS)));
  }

  return rows.slice(0, MAX_ACTION_ROWS);
}

/**
 * Collect everything the panel needs to render itself from the current
 * guild state.
 */
async function collectPanelData(client, interaction, settings) {
  const guild = guildOf(client, interaction);
  const configured = Array.isArray(settings.ticketSupportRoles) ? settings.ticketSupportRoles : [];
  return {
    categories:     await collectChannels(guild, [ChannelType.GuildCategory]),
    logChannels:    await collectChannels(guild, LOG_CHANNEL_TYPES),
    addableRoles:   collectAssignableRoles(guild).filter((role) => !configured.includes(role.id)),
    configuredRoles: collectConfiguredRoles(guild, configured),
  };
}

// ── Settings writes (same columns as /settings tickets) ────────
async function applyToggle(settings) {
  const next = !settings.ticketEnabled;
  await settings.update({ ticketEnabled: next });
  return {
    ok: true,
    message: `The ticket system is now **${next ? 'enabled' : 'disabled'}**.`,
  };
}

async function applyCategory(settings, categoryId) {
  if (!categoryId) return { ok: false, message: 'No ticket category was selected.' };
  await settings.update({ ticketCategoryId: String(categoryId) });
  return { ok: true, message: `New tickets will be created in <#${categoryId}>.` };
}

async function applyLogChannel(settings, channelId) {
  if (!channelId) return { ok: false, message: 'No log channel was selected.' };
  await settings.update({ ticketLogChannelId: String(channelId) });
  return { ok: true, message: `Ticket transcripts will be sent to <#${channelId}>.` };
}

async function applyRoleAdd(settings, roleId) {
  if (!roleId) return { ok: false, message: 'No role was selected.' };
  const current = Array.isArray(settings.ticketSupportRoles) ? [...settings.ticketSupportRoles] : [];
  const id = String(roleId);
  if (current.includes(id)) return { ok: false, message: `<@&${id}> is already a support role.` };
  current.push(id);
  await settings.update({ ticketSupportRoles: current });
  return { ok: true, message: `<@&${id}> can now work tickets.` };
}

async function applyRoleRemove(settings, roleId) {
  if (!roleId) return { ok: false, message: 'No role was selected.' };
  const current = Array.isArray(settings.ticketSupportRoles) ? [...settings.ticketSupportRoles] : [];
  const id = String(roleId);
  const next = current.filter((entry) => entry !== id);
  if (next.length === current.length) return { ok: false, message: `<@&${id}> was not a support role.` };
  await settings.update({ ticketSupportRoles: next });
  return { ok: true, message: `<@&${id}> can no longer work tickets.` };
}

// ── Interaction plumbing ───────────────────────────────────────
/**
 * Acknowledge a component interaction. Every path acks BEFORE any DB
 * write so the 3 second interaction deadline is never missed.
 */
async function acknowledge(interaction) {
  try {
    if (isFunction(interaction?.deferUpdate)) {
      await interaction.deferUpdate();
      return;
    }
  } catch {
    /* already acknowledged — the fallback below takes over */
  }
  try {
    if (isFunction(interaction?.reply)) await interaction.reply({ content: 'Working…' });
  } catch {
    /* nothing else can be done for this interaction */
  }
}

/**
 * Ephemeral feedback for the admin. Never throws.
 */
async function feedback(interaction, type, message) {
  try {
    await interaction.followUp({
      embeds: [buildEmbed({ type, description: message })],
      flags: MessageFlags.Ephemeral,
    });
  } catch {
    /* the follow-up could not be delivered */
  }
}

/**
 * Re-render the panel message with the state that was just written.
 */
async function refreshPanel(client, interaction, componentInteraction, settings) {
  try {
    const data = await collectPanelData(client, interaction, settings);
    await componentInteraction.editReply({
      embeds: [buildPanelEmbed(settings)],
      components: buildPanelRows(settings, data),
    });
  } catch (err) {
    client.logger?.warn?.(`[tpanel] panel refresh failed: ${err?.message ?? err}`);
  }
}

/**
 * Handle one collected component interaction.
 */
async function handleComponent(client, interaction, componentInteraction) {
  try {
    // Only the admin who opened the panel may operate it.
    if (componentInteraction?.user?.id !== interaction.user.id) return;
    const customId = componentInteraction.customId;
    if (!Object.values(CUSTOM_IDS).includes(customId)) return;

    // Ack first, write second.
    await acknowledge(componentInteraction);

    const settings = await loadSettings(client, interaction.guildId);
    if (!settings) {
      await feedback(componentInteraction, 'error', 'Ticket settings storage is unavailable right now.');
      return;
    }

    const value = Array.isArray(componentInteraction.values) ? componentInteraction.values[0] : null;

    let outcome;
    switch (customId) {
      case CUSTOM_IDS.toggle:     outcome = await applyToggle(settings); break;
      case CUSTOM_IDS.category:   outcome = await applyCategory(settings, value); break;
      case CUSTOM_IDS.log:        outcome = await applyLogChannel(settings, value); break;
      case CUSTOM_IDS.roleAdd:    outcome = await applyRoleAdd(settings, value); break;
      case CUSTOM_IDS.roleRemove: outcome = await applyRoleRemove(settings, value); break;
      default: return;
    }

    await refreshPanel(client, interaction, componentInteraction, settings);
    await feedback(componentInteraction, outcome.ok ? 'success' : 'warning', outcome.message);
  } catch (err) {
    client.logger?.warn?.(`[tpanel] component handling failed: ${err?.message ?? err}`);
    await feedback(componentInteraction, 'error', 'The ticket configurator hit an unexpected error. Please try again.');
  }
}

/**
 * Last-resort error surface. Never throws and never logs an error.
 */
async function fail(client, interaction, err) {
  client.logger?.warn?.(`[tpanel] ${err?.message ?? err}`);
  const payload = {
    embeds: [buildEmbed({ type: 'error', description: 'The ticket configurator hit an unexpected error. Please try again.' })],
    flags: MessageFlags.Ephemeral,
  };
  try {
    if (interaction?.replied || interaction?.deferred) await interaction.followUp(payload);
    else await interaction.reply(payload);
  } catch {
    /* the interaction is gone — nothing else to do */
  }
}

export const tpanel = {
  data: new SlashCommandBuilder()
    .setName('tpanel')
    .setDescription('Open the Visual Ticket Configurator')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  botPermissions: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks],
  guildOnly: true,

  async execute(client, interaction) {
    try {
      // ── 1. Permission pre-flight ─────────────────────────────
      const missing = missingBotPermissions(interaction);
      if (missing.length) {
        return await interaction.reply({
          embeds: [buildEmbed({
            type: 'error',
            title: '❌ Missing Permissions',
            description: formatMissingBotPermissions(missing, interaction.channel),
          })],
          flags: MessageFlags.Ephemeral,
        });
      }

      // ── 2. Ack before any DB work ───────────────────────────
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      // ── 3. Read the live settings row ───────────────────────
      const settings = await loadSettings(client, interaction.guildId);
      if (!settings) {
        return await interaction.editReply({
          embeds: [buildEmbed({
            type: 'error',
            description: 'Ticket settings storage is unavailable right now. Please try again in a moment.',
          })],
        });
      }

      // ── 4. Render the panel with the current state ──────────
      const data = await collectPanelData(client, interaction, settings);
      const panelMessage = await interaction.editReply({
        embeds: [buildPanelEmbed(settings)],
        components: buildPanelRows(settings, data),
      });

      if (!panelMessage || !isFunction(panelMessage.createMessageComponentCollector)) return;

      // ── 5. Collect the panel interactions ────────────────────
      const collector = panelMessage.createMessageComponentCollector({
        filter: (i) => i?.user?.id === interaction.user.id,
        time: COLLECTOR_TIME,
      });

      collector.on('collect', (i) => handleComponent(client, interaction, i));
      collector.on('end', () => {
        interaction.editReply({ components: [] }).catch(() => {});
      });
    } catch (err) {
      await fail(client, interaction, err);
    }
  },
};

export default tpanel;

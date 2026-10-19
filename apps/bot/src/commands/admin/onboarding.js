// ================================================================
//  AURA BOT v2.0 — Server Onboarding Checklist  (/onboarding)
//
//  A read-only setup report for administrators: it inspects what is
//  already configured in THIS guild and tells the admin — per feature —
//  whether it is fully configured, partially configured or missing,
//  together with the exact slash command that configures it.
//
//  Design notes
//  ------------
//  • READ-ONLY. The command never writes to the database.
//  • Every attribute is read defensively. A column that does not exist
//    on the model is skipped instead of throwing, so the checklist can
//    never crash on a schema that is older or newer than the bot.
//  • The reply is ephemeral: it is admin configuration information.
// ================================================================
import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { buildEmbed } from '../../../../../packages/utils/embedBuilder.js';

// ─── Permission catalogue ─────────────────────────────────────────
const PERMISSION_BITS = {
  'Send Messages': PermissionFlagsBits.SendMessages,
  'Embed Links': PermissionFlagsBits.EmbedLinks,
  'Manage Roles': PermissionFlagsBits.ManageRoles,
  'Manage Channels': PermissionFlagsBits.ManageChannels,
  'Manage Messages': PermissionFlagsBits.ManageMessages,
  'Manage Server': PermissionFlagsBits.ManageGuild,
  'Ban Members': PermissionFlagsBits.BanMembers,
  'Kick Members': PermissionFlagsBits.KickMembers,
  'Move Members': PermissionFlagsBits.MoveMembers,
  'Timeout Members': PermissionFlagsBits.ModerateMembers,
  'View Audit Log': PermissionFlagsBits.ViewAuditLog,
};

const STATE_ICON = { ok: '✅', partial: '⚠️', none: '❌' };

// ─── Feature checklist ────────────────────────────────────────────
// `columns` lists the GuildSettings attributes the feature depends on:
// when NONE of them exists on the model the feature is omitted from the
// report instead of being reported with invented values.
// `perms` lists the bot permissions the feature needs to work.
const FEATURES = [
  // ── Security & moderation ───────────────────────────────────
  {
    id: 'antinuke',
    label: 'Anti-nuke & anti-raid',
    cmd: '/settings antinuke',
    group: 'security',
    perms: ['Ban Members', 'Kick Members', 'Manage Roles', 'Manage Channels'],
    columns: ['antiNukeEnabled', 'antiRaidEnabled', 'antiNukeConfig'],
    evaluate: (r) => {
      const nuke = r.get('antiNukeEnabled') === true;
      const raid = r.get('antiRaidEnabled') === true;
      if (nuke && raid) return { state: 'ok', note: 'nuke + raid armed' };
      if (nuke) return { state: 'partial', note: 'nuke armed, raid flag off' };
      if (raid) return { state: 'partial', note: 'raid flag on, nuke off' };
      return { state: 'none', note: 'protection disabled' };
    },
  },
  {
    id: 'aimod',
    label: 'AI & auto moderation',
    cmd: '/settings aimod',
    group: 'security',
    perms: ['Send Messages', 'Manage Messages', 'Timeout Members'],
    columns: ['aiModEnabled', 'aiModSensitivity', 'autoModEnabled'],
    evaluate: (r) => {
      const ai = r.get('aiModEnabled') === true;
      const auto = r.get('autoModEnabled') === true;
      const sensitivity = r.get('aiModSensitivity');
      if (ai && auto) {
        return {
          state: 'ok',
          note: sensitivity ? `AI + keyword filters (${sensitivity})` : 'AI + keyword filters',
        };
      }
      if (ai) return { state: 'partial', note: 'AI only · keyword filters off' };
      if (auto) return { state: 'partial', note: 'keyword filters only · AI off' };
      return { state: 'none', note: 'not enabled' };
    },
  },
  {
    id: 'verification',
    label: 'Member verification',
    cmd: '/verify setup',
    group: 'security',
    perms: ['Manage Roles', 'Send Messages', 'Embed Links'],
    columns: ['verificationEnabled', 'verificationRoleId', 'verificationChannelId'],
    evaluate: (r) => {
      const enabled = r.get('verificationEnabled') === true;
      const roleId = r.get('verificationRoleId');
      const channelId = r.get('verificationChannelId');
      if (enabled && roleId && channelId) return { state: 'ok', note: 'role + panel channel set' };
      if (enabled && roleId) return { state: 'partial', note: 'role set, panel channel missing' };
      if (enabled) return { state: 'partial', note: 'enabled, no verified role' };
      if (roleId) return { state: 'partial', note: 'role set, still disabled' };
      return { state: 'none', note: 'not configured' };
    },
  },
  {
    id: 'logs',
    label: 'Log channels',
    cmd: '/settings modlog · /settings auditlog',
    group: 'security',
    perms: ['Send Messages', 'Embed Links'],
    columns: ['modLogChannelId', 'auditLogChannelId', 'staffLogChannelId', 'voiceLogChannelId'],
    evaluate: (r) => {
      const keys = ['modLogChannelId', 'auditLogChannelId', 'staffLogChannelId', 'voiceLogChannelId'];
      const set = keys.filter(k => r.get(k));
      if (set.length === 0) return { state: 'none', note: 'no log channel set' };
      if (set.length < keys.length) return { state: 'partial', note: `${set.length}/${keys.length} channels set` };
      return { state: 'ok', note: 'mod · audit · staff · voice' };
    },
  },

  // ── Community & onboarding ─────────────────────────────────
  {
    id: 'welcome',
    label: 'Welcome system',
    cmd: '/settings welcome',
    group: 'community',
    perms: ['Send Messages', 'Embed Links'],
    columns: ['welcomeEnabled', 'welcomeChannelId', 'welcomeMessage', 'welcomeCard'],
    evaluate: (r) => {
      const enabled = r.get('welcomeEnabled') === true;
      const channelId = r.get('welcomeChannelId');
      if (enabled && channelId) return { state: 'ok', note: `enabled · <#${channelId}>` };
      if (enabled) return { state: 'partial', note: 'enabled, no channel set' };
      if (channelId) return { state: 'partial', note: 'channel set, still disabled' };
      return { state: 'none', note: 'not enabled' };
    },
  },
  {
    id: 'farewell',
    label: 'Farewell system',
    cmd: '/settings farewell',
    group: 'community',
    perms: ['Send Messages', 'Embed Links'],
    columns: ['farewellEnabled', 'farewellChannelId', 'farewellMessage'],
    evaluate: (r) => {
      const enabled = r.get('farewellEnabled') === true;
      const channelId = r.get('farewellChannelId');
      if (enabled && channelId) return { state: 'ok', note: `enabled · <#${channelId}>` };
      if (enabled) return { state: 'partial', note: 'enabled, no channel set' };
      if (channelId) return { state: 'partial', note: 'channel set, still disabled' };
      return { state: 'none', note: 'not enabled' };
    },
  },
  {
    id: 'autorole',
    label: 'Auto role on join',
    cmd: '/settings autorole',
    group: 'community',
    perms: ['Manage Roles'],
    columns: ['autoRoleId', 'autoRoleDelay'],
    evaluate: (r) => {
      const roleId = r.get('autoRoleId');
      if (!roleId) return { state: 'none', note: 'no auto role set' };
      const delay = Number(r.get('autoRoleDelay'));
      if (Number.isFinite(delay) && delay > 0) {
        return { state: 'ok', note: `<@&${roleId}> after ${delay}s` };
      }
      return { state: 'partial', note: `<@&${roleId}> — no delay configured` };
    },
  },
  {
    id: 'tickets',
    label: 'Ticket system',
    cmd: '/settings tickets',
    group: 'community',
    perms: ['Manage Channels', 'Manage Roles', 'Send Messages'],
    columns: ['ticketEnabled', 'ticketCategoryId', 'ticketSupportRoles', 'ticketLogChannelId'],
    evaluate: (r) => {
      const enabled = r.get('ticketEnabled') === true;
      const categoryId = r.get('ticketCategoryId');
      const roles = r.get('ticketSupportRoles');
      const roleCount = Array.isArray(roles) ? roles.length : 0;
      if (enabled && categoryId && roleCount > 0) {
        return { state: 'ok', note: `category + ${roleCount} support role(s)` };
      }
      if (enabled && categoryId) return { state: 'partial', note: 'no support role assigned' };
      if (enabled) return { state: 'partial', note: 'no ticket category set' };
      return { state: 'none', note: 'not enabled' };
    },
  },
  {
    id: 'tempvoice',
    label: 'Temp voice channels',
    cmd: '/voice setup',
    group: 'community',
    perms: ['Manage Channels', 'Move Members', 'Manage Roles'],
    columns: ['tempVoiceEnabled', 'tempVoiceCreatorId', 'tempVoiceCategoryId'],
    evaluate: (r) => {
      const enabled = r.get('tempVoiceEnabled') === true;
      const creatorId = r.get('tempVoiceCreatorId');
      if (enabled && creatorId) return { state: 'ok', note: 'creator channel set' };
      if (enabled) return { state: 'partial', note: 'enabled, no creator channel' };
      if (creatorId) return { state: 'partial', note: 'creator channel set, still disabled' };
      return { state: 'none', note: 'not enabled' };
    },
  },
  {
    id: 'reactionroles',
    label: 'Reaction roles',
    cmd: '/reactionrole add',
    group: 'community',
    perms: ['Manage Roles'],
    columns: [],
    evaluate: (r, ctx) => {
      const count = ctx.counts.reactionRoles;
      if (count === null) return null;              // model unavailable → omit
      if (count === 0) return { state: 'none', note: 'no rules yet' };
      return { state: 'ok', note: `${count} rule(s)` };
    },
  },
  {
    id: 'applications',
    label: 'Staff applications',
    cmd: '/apply start',
    group: 'community',
    perms: ['Manage Roles', 'Send Messages', 'Embed Links'],
    columns: [],
    evaluate: (r, ctx) => {
      const count = ctx.counts.applicationForms;
      if (count === null) return null;
      if (count === 0) return { state: 'none', note: 'no application form' };
      return { state: 'ok', note: `${count} form(s) open` };
    },
  },

  // ── Engagement & automation ────────────────────────────────
  {
    id: 'leveling',
    label: 'Leveling & XP',
    cmd: '/settings leveling',
    group: 'engagement',
    perms: ['Send Messages', 'Manage Roles'],
    columns: ['levelingEnabled', 'levelUpChannelId', 'xpMultiplier', 'xpDecayEnabled'],
    evaluate: (r) => {
      const enabled = r.get('levelingEnabled') === true;
      const channelId = r.get('levelUpChannelId');
      const multiplier = Number(r.get('xpMultiplier'));
      const mult = Number.isFinite(multiplier) && multiplier > 0 ? `×${multiplier}` : null;
      if (enabled && channelId) {
        return { state: 'ok', note: `enabled · <#${channelId}>${mult ? ` · ${mult}` : ''}` };
      }
      if (enabled) return { state: 'partial', note: `enabled${mult ? ` · ${mult}` : ''} — no level-up channel` };
      return { state: 'none', note: 'not enabled' };
    },
  },
  {
    id: 'levelrewards',
    label: 'Level rewards',
    cmd: '/settings leveling',
    group: 'engagement',
    perms: ['Manage Roles'],
    columns: [],
    evaluate: (r, ctx) => {
      const count = ctx.counts.levelRewards;
      if (count === null) return null;
      if (count === 0) return { state: 'none', note: 'no role rewards defined' };
      return { state: 'ok', note: `${count} reward(s)` };
    },
  },
  {
    id: 'suggestions',
    label: 'Suggestions',
    cmd: '/suggest setup',
    group: 'engagement',
    perms: ['Send Messages', 'Manage Messages', 'Embed Links'],
    columns: ['suggestionsEnabled', 'suggestionsChannelId'],
    evaluate: (r) => {
      const enabled = r.get('suggestionsEnabled') === true;
      const channelId = r.get('suggestionsChannelId');
      if (enabled && channelId) return { state: 'ok', note: `enabled · <#${channelId}>` };
      if (enabled) return { state: 'partial', note: 'enabled, no channel set' };
      if (channelId) return { state: 'partial', note: 'channel set, still disabled' };
      return { state: 'none', note: 'not enabled' };
    },
  },
  {
    id: 'birthday',
    label: 'Birthday announcements',
    cmd: '/birthday configure',
    group: 'engagement',
    perms: ['Send Messages', 'Manage Roles', 'Embed Links'],
    columns: ['birthdayEnabled', 'birthdayChannelId', 'birthdayRoleId', 'birthdayMessage'],
    evaluate: (r) => {
      const enabled = r.get('birthdayEnabled') === true;
      const channelId = r.get('birthdayChannelId');
      const roleId = r.get('birthdayRoleId');
      if (enabled && channelId) return { state: 'ok', note: `enabled · <#${channelId}>` };
      if (enabled) return { state: 'partial', note: 'enabled, no channel set' };
      if (channelId) return { state: 'partial', note: 'channel set, still disabled' };
      return { state: 'none', note: 'not enabled' };
    },
  },
  {
    id: 'timedmessages',
    label: 'Timed messages',
    cmd: '/timedmsg add',
    group: 'engagement',
    perms: ['Send Messages'],
    columns: [],
    evaluate: (r, ctx) => {
      const count = ctx.counts.timedMessages;
      if (count === null) return null;
      if (count === 0) return { state: 'none', note: 'no scheduled messages' };
      return { state: 'ok', note: `${count} scheduled` };
    },
  },
  {
    id: 'autoresponder',
    label: 'Auto-responder',
    cmd: '/autoresponder add',
    group: 'engagement',
    perms: ['Send Messages'],
    columns: [],
    evaluate: (r, ctx) => {
      const count = ctx.counts.autoResponders;
      if (count === null) return null;
      if (count === 0) return { state: 'none', note: 'no auto-responder configured' };
      return { state: 'ok', note: `${count} responder(s)` };
    },
  },
  {
    id: 'customcommands',
    label: 'Custom commands',
    cmd: '/customcmd add',
    group: 'engagement',
    perms: ['Send Messages'],
    columns: [],
    evaluate: (r, ctx) => {
      const count = ctx.counts.customCommands;
      if (count === null) return null;
      if (count === 0) return { state: 'none', note: 'no custom command defined' };
      return { state: 'ok', note: `${count} command(s)` };
    },
  },
  {
    id: 'social',
    label: 'Social alerts',
    cmd: '/social add',
    group: 'engagement',
    perms: ['Send Messages', 'Embed Links'],
    columns: ['socialAlertsConfig'],
    evaluate: (r) => {
      const cfg = r.get('socialAlertsConfig');
      const alerts = Array.isArray(cfg?.alerts) ? cfg.alerts : [];
      if (alerts.length === 0) return { state: 'none', note: 'no alert configured' };
      return { state: 'ok', note: `${alerts.length} alert(s)` };
    },
  },
  {
    id: 'invitetrack',
    label: 'Invite tracking',
    cmd: '/settings invitetrack',
    group: 'engagement',
    perms: ['Send Messages'],
    columns: ['inviteTrackEnabled', 'inviteConfig'],
    evaluate: (r) => {
      if (r.get('inviteTrackEnabled') === true) return { state: 'ok', note: 'tracking joins' };
      return { state: 'none', note: 'not enabled' };
    },
  },

  // ── Economy & branding ─────────────────────────────────────
  {
    id: 'economy',
    label: 'Economy & shop',
    cmd: '/shop add',
    group: 'economy',
    perms: ['Send Messages', 'Embed Links'],
    columns: [],
    evaluate: (r, ctx) => {
      const count = ctx.counts.shopItems;
      if (count === null) return null;
      if (count === 0) return { state: 'none', note: 'shop has no items' };
      return { state: 'ok', note: `${count} item(s) in shop` };
    },
  },
  {
    id: 'aesthetic',
    label: 'Custom emojis',
    cmd: '/aesthetic',
    group: 'economy',
    perms: ['Send Messages', 'Embed Links'],
    columns: ['customEmojis'],
    evaluate: (r) => {
      const cfg = r.get('customEmojis');
      const keys = cfg && typeof cfg === 'object' ? Object.keys(cfg) : [];
      if (keys.length === 0) return { state: 'none', note: 'no custom emoji set' };
      return { state: 'ok', note: `${keys.length} custom emoji(s)` };
    },
  },
];

const GROUP_TITLES = {
  security: '🛡️ Security & Moderation',
  community: '👥 Community & Onboarding',
  engagement: '📈 Engagement & Automation',
  economy: '💎 Economy & Branding',
};

const GROUP_ORDER = ['security', 'community', 'engagement', 'economy'];

/**
 * Column reader that never throws on a missing attribute.
 * A column counts as "present" when the MODEL declares it (even if the
 * guild has no settings row yet) or when the loaded row carries it.
 */
function createReader(settings, model) {
  const raw = model?.rawAttributes;
  const modelHas = key => Boolean(raw) && typeof raw === 'object' && Object.prototype.hasOwnProperty.call(raw, key);
  const rowHas = key => Boolean(settings) && Object.prototype.hasOwnProperty.call(settings, key);
  return {
    has: key => modelHas(key) || rowHas(key),
    get: key => (settings ? settings[key] : undefined),
  };
}

/** Count the rows of a model for this guild. `null` = model unavailable. */
async function countRows(client, model, guildId, label) {
  if (!model || typeof model.count !== 'function') return null;
  try {
    return Number(await model.count({ where: { guildId } })) || 0;
  } catch (err) {
    client.logger?.warn?.(`[Onboarding] ${label} count failed: ${err?.message || err}`);
    return 0;
  }
}

// ─── /onboarding ─────────────────────────────────────────────────
export const onboarding = {
  data: new SlashCommandBuilder()
    .setName('onboarding')
    .setDescription('Show how much of Aura is configured for this server, and what to set up next')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  userPermissions: [PermissionFlagsBits.ManageGuild],
  botPermissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  cooldown: 10_000,

  async execute(client, interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch(() => {});

    try {
      const guildId = interaction.guildId;
      const models = client.db?.models ?? {};
      const GuildSettings = models.GuildSettings;

      const settings = GuildSettings
        ? await GuildSettings.findOne({ where: { guildId } }).catch(err => {
            client.logger?.warn?.(`[Onboarding] settings lookup failed: ${err?.message || err}`);
            return null;
          })
        : null;

      const reader = createReader(settings, GuildSettings);

      const counts = {
        reactionRoles: await countRows(client, models.ReactionRole, guildId, 'reaction roles'),
        levelRewards: await countRows(client, models.LevelReward, guildId, 'level rewards'),
        shopItems: await countRows(client, models.ShopItem, guildId, 'shop items'),
        customCommands: await countRows(client, models.CustomCommand, guildId, 'custom commands'),
        autoResponders: await countRows(client, models.AutoResponder, guildId, 'auto responders'),
        timedMessages: await countRows(client, models.TimedMessage, guildId, 'timed messages'),
        applicationForms: await countRows(client, models.ApplicationForm, guildId, 'application forms'),
      };

      const ctx = { r: reader, counts };

      // ── Evaluate every feature ───────────────────────────────
      const evaluated = [];
      for (const feature of FEATURES) {
        // A feature whose columns do not exist on the model at all is
        // omitted instead of being reported with invented values.
        const relevant = feature.columns.length === 0
          || feature.columns.some((column) => reader.has(column));
        if (!relevant) continue;

        let result = null;
        try {
          result = feature.evaluate(reader, ctx);
        } catch (err) {
          client.logger?.warn?.(`[Onboarding] feature "${feature.id}" failed: ${err?.message || err}`);
          result = null;
        }
        if (!result) continue;
        evaluated.push({ ...feature, ...result });
      }

      const ok = evaluated.filter(f => f.state === 'ok').length;
      const partial = evaluated.filter(f => f.state === 'partial').length;
      const missing = evaluated.filter(f => f.state === 'none').length;
      const total = evaluated.length;

      // ── Group the rows into embed fields ─────────────────────
      const checklistFields = [];
      for (const group of GROUP_ORDER) {
        const rows = evaluated.filter(f => f.group === group);
        if (!rows.length) continue;
        const lines = rows.map(f =>
          `${STATE_ICON[f.state]} **${f.label}** — ${f.note} · \`${f.cmd}\``);
        checklistFields.push({
          name: GROUP_TITLES[group] || group,
          value: lines.join('\n'),
          inline: false,
        });
      }

      const percent = total > 0 ? Math.round(((ok + partial * 0.5) / total) * 100) : 0;
      const filled = Math.max(0, Math.min(20, Math.floor(percent / 5)));
      const bar = '█'.repeat(filled) + '░'.repeat(20 - filled);

      const checklistEmbed = buildEmbed({
        type: 'info',
        title: '🧭 Aura Setup Checklist',
        description: [
          `**${ok}/${total}** features fully configured · ${partial} partial · ${missing} missing`,
          `${bar} **${percent}%**`,
          total === 0
            ? '_No configuration columns were found on this server — the bot schema may be out of date._'
            : '_Every row shows the exact command that configures it._',
        ].join('\n'),
        fields: checklistFields,
        footer: `Server: ${interaction.guild?.name ?? guildId}`,
        timestamp: true,
      });

      // ── Bot permissions & intents ────────────────────────────
      const required = new Set(['Manage Server', 'View Audit Log']);
      for (const feature of FEATURES) {
        for (const perm of feature.perms ?? []) required.add(perm);
      }

      const botPermissions = interaction.guild?.members?.me?.permissions;
      const canCheck = Boolean(botPermissions && typeof botPermissions.has === 'function');
      const has = [];
      const missingPerms = [];
      if (canCheck) {
        for (const label of required) {
          const bit = PERMISSION_BITS[label];
          if (bit === undefined) continue;
          if (botPermissions.has(bit)) has.push(label);
          else missingPerms.push(label);
        }
      }

      const permissionFields = [];
      if (!canCheck) {
        permissionFields.push({
          name: '🔐 Bot permissions',
          value: '⚠️ I could not read my own permissions in this server. Check *Server Settings → Roles → Aura* manually.',
          inline: false,
        });
      } else {
        permissionFields.push({
          name: '✅ Permissions the bot has',
          value: has.length ? has.map(p => `• ${p}`).join('\n') : '— none of the required permissions',
          inline: true,
        });
        permissionFields.push({
          name: '❌ Permissions the bot is missing',
          value: missingPerms.length
            ? missingPerms.map(p => `• ${p}`).join('\n')
            : 'None — the bot holds every permission this feature set needs.',
          inline: true,
        });
      }

      permissionFields.push({
        name: '🔑 Privileged intents (informational)',
        value: [
          'Enable **Message Content Intent** and **Server Members Intent** in the',
          'Developer Portal → your app → Privileged Gateway Intents.',
          'Message-content driven features (auto-moderation, auto-responder,',
          'leveling, invite tracking) stay silent until both are switched on.',
        ].join('\n'),
        inline: false,
      });

      // ── Next best action ─────────────────────────────────────
      const nextMissing = evaluated.find(f => f.state === 'none');
      const nextPartial = evaluated.find(f => f.state === 'partial');
      const next = nextMissing || nextPartial;
      permissionFields.push({
        name: '🚀 Next best action',
        value: next
          ? (next.state === 'none'
              ? `Set up **${next.label}** — run \`${next.cmd}\`.`
              : `Finish **${next.label}** — run \`${next.cmd}\`.`)
          : '🎉 Every feature in this checklist is fully configured. Nothing left to do.',
        inline: false,
      });

      const permissionsEmbed = buildEmbed({
        type: nextMissing ? 'warning' : 'success',
        title: '🔐 Permissions, Intents & Next Step',
        fields: permissionFields,
        footer: 'Aura Enterprise • Setup Report',
        timestamp: true,
      });

      return interaction.editReply({
        embeds: [checklistEmbed, permissionsEmbed],
      });
    } catch (err) {
      client.logger?.warn?.(`[Onboarding] command failed: ${err?.message || err}`);
      return interaction.editReply({
        embeds: [buildEmbed({
          type: 'error',
          title: 'Setup Report Unavailable',
          description: '❌ The setup checklist could not be generated. Please try again in a moment.',
        })],
      }).catch(() => {});
    }
  },
};

export default onboarding;

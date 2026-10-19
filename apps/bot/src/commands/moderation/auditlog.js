// ================================================================
//  AURA BOT v2.0 — Discord Audit Log Viewer  (/auditlog)
//
//  A real moderator-facing audit log reader. It talks to the Discord
//  API (`guild.fetchAuditLogs`) — NOT to the database — so it shows
//  exactly what Discord recorded, including actions performed by
//  other bots and by Discord itself.
//
//  Design notes
//  ------------
//  • The reply is ephemeral: audit logs are sensitive.
//  • A missing "View Audit Log" permission is reported with a clear
//    message instead of a stack trace.
//  • Raw action numbers are never shown: every event is mapped to a
//    readable label.
// ================================================================
import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, AuditLogEvent } from 'discord.js';
import { buildEmbed } from '../../../../../packages/utils/embedBuilder.js';

// ─── Action catalogue ─────────────────────────────────────────────
// Labels are keyed by the AuditLogEvent member NAME so an event that
// does not exist in the installed discord.js version is simply skipped
// instead of producing an "undefined" entry.
const ACTION_LABELS = {
  GuildUpdate: 'Server updated',
  ChannelCreate: 'Channel created',
  ChannelUpdate: 'Channel updated',
  ChannelDelete: 'Channel deleted',
  ChannelOverwriteCreate: 'Permission overwrite created',
  ChannelOverwriteUpdate: 'Permission overwrite updated',
  ChannelOverwriteDelete: 'Permission overwrite deleted',
  MemberKick: 'Member kicked',
  MemberPrune: 'Members pruned',
  MemberBanAdd: 'Member banned',
  MemberBanRemove: 'Member unbanned',
  MemberUpdate: 'Member updated',
  MemberRoleUpdate: 'Member roles updated',
  MemberMove: 'Member moved',
  MemberDisconnect: 'Member disconnected',
  BotAdd: 'Bot added',
  RoleCreate: 'Role created',
  RoleUpdate: 'Role updated',
  RoleDelete: 'Role deleted',
  InviteCreate: 'Invite created',
  InviteUpdate: 'Invite updated',
  InviteDelete: 'Invite deleted',
  WebhookCreate: 'Webhook created',
  WebhookUpdate: 'Webhook updated',
  WebhookDelete: 'Webhook deleted',
  EmojiCreate: 'Emoji created',
  EmojiUpdate: 'Emoji updated',
  EmojiDelete: 'Emoji deleted',
  MessageDelete: 'Message deleted',
  MessageBulkDelete: 'Messages bulk-deleted',
  MessagePin: 'Message pinned',
  MessageUnpin: 'Message unpinned',
  IntegrationCreate: 'Integration created',
  IntegrationUpdate: 'Integration updated',
  IntegrationDelete: 'Integration deleted',
  StageInstanceCreate: 'Stage created',
  StageInstanceUpdate: 'Stage updated',
  StageInstanceDelete: 'Stage deleted',
  StickerCreate: 'Sticker created',
  StickerUpdate: 'Sticker updated',
  StickerDelete: 'Sticker deleted',
  GuildScheduledEventCreate: 'Scheduled event created',
  GuildScheduledEventUpdate: 'Scheduled event updated',
  GuildScheduledEventDelete: 'Scheduled event deleted',
  ThreadCreate: 'Thread created',
  ThreadUpdate: 'Thread updated',
  ThreadDelete: 'Thread deleted',
  ApplicationCommandPermissionUpdate: 'Command permissions updated',
  SoundboardSoundCreate: 'Soundboard sound created',
  SoundboardSoundUpdate: 'Soundboard sound updated',
  SoundboardSoundDelete: 'Soundboard sound deleted',
  AutoModerationRuleCreate: 'Auto-mod rule created',
  AutoModerationRuleUpdate: 'Auto-mod rule updated',
  AutoModerationRuleDelete: 'Auto-mod rule deleted',
  AutoModerationBlockMessage: 'Message blocked by auto-mod',
  AutoModerationFlagToChannel: 'Message flagged to channel',
  AutoModerationUserCommunicationDisabled: 'Auto-mod disabled communication',
  AutoModerationQuarantineUser: 'User quarantined by auto-mod',
  OnboardingPromptCreate: 'Onboarding prompt created',
  OnboardingPromptUpdate: 'Onboarding prompt updated',
  OnboardingPromptDelete: 'Onboarding prompt deleted',
  OnboardingCreate: 'Onboarding created',
  OnboardingUpdate: 'Onboarding updated',
  HomeSettingsCreate: 'Home settings created',
  HomeSettingsUpdate: 'Home settings updated',
  VoiceChannelStatusCreate: 'Voice channel status created',
  VoiceChannelStatusDelete: 'Voice channel status deleted',
};

// Friendly option value → AuditLogEvent member name.
const ACTION_ALIASES = {
  ban: 'MemberBanAdd',
  unban: 'MemberBanRemove',
  kick: 'MemberKick',
  prune: 'MemberPrune',
  member_update: 'MemberUpdate',
  member_role_update: 'MemberRoleUpdate',
  member_move: 'MemberMove',
  member_disconnect: 'MemberDisconnect',
  bot_add: 'BotAdd',
  role_create: 'RoleCreate',
  role_update: 'RoleUpdate',
  role_delete: 'RoleDelete',
  channel_create: 'ChannelCreate',
  channel_update: 'ChannelUpdate',
  channel_delete: 'ChannelDelete',
  overwrite_create: 'ChannelOverwriteCreate',
  overwrite_update: 'ChannelOverwriteUpdate',
  overwrite_delete: 'ChannelOverwriteDelete',
  thread_create: 'ThreadCreate',
  thread_update: 'ThreadUpdate',
  thread_delete: 'ThreadDelete',
  message_delete: 'MessageDelete',
  message_bulk_delete: 'MessageBulkDelete',
  message_pin: 'MessagePin',
  message_unpin: 'MessageUnpin',
  invite_create: 'InviteCreate',
  invite_update: 'InviteUpdate',
  invite_delete: 'InviteDelete',
  webhook_create: 'WebhookCreate',
  webhook_update: 'WebhookUpdate',
  webhook_delete: 'WebhookDelete',
  emoji_create: 'EmojiCreate',
  emoji_update: 'EmojiUpdate',
  emoji_delete: 'EmojiDelete',
  integration_create: 'IntegrationCreate',
  integration_update: 'IntegrationUpdate',
  integration_delete: 'IntegrationDelete',
  stage_create: 'StageInstanceCreate',
  stage_update: 'StageInstanceUpdate',
  stage_delete: 'StageInstanceDelete',
  sticker_create: 'StickerCreate',
  sticker_update: 'StickerUpdate',
  sticker_delete: 'StickerDelete',
  scheduled_event_create: 'GuildScheduledEventCreate',
  scheduled_event_update: 'GuildScheduledEventUpdate',
  scheduled_event_delete: 'GuildScheduledEventDelete',
  application_command_permission_update: 'ApplicationCommandPermissionUpdate',
  soundboard_create: 'SoundboardSoundCreate',
  soundboard_update: 'SoundboardSoundUpdate',
  soundboard_delete: 'SoundboardSoundDelete',
  auto_moderation_rule_create: 'AutoModerationRuleCreate',
  auto_moderation_rule_update: 'AutoModerationRuleUpdate',
  auto_moderation_rule_delete: 'AutoModerationRuleDelete',
  guild_update: 'GuildUpdate',
  server_update: 'GuildUpdate',
};

/** numeric audit event → readable label */
const LABEL_BY_EVENT = new Map(
  Object.entries(ACTION_LABELS)
    .map(([name, label]) => [AuditLogEvent[name], label])
    .filter(([value]) => typeof value === 'number'),
);

/** Human readable label for an audit event. Never leaks the raw number. */
function actionLabel(action) {
  return LABEL_BY_EVENT.get(action) ?? 'Unknown action';
}

/**
 * Resolve a user supplied action name to an AuditLogEvent value.
 * Unknown names resolve to `null` — the filter is ignored, never thrown.
 */
function resolveAction(raw) {
  if (typeof raw !== 'string') return null;
  const key = raw.trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (!key) return null;

  const alias = ACTION_ALIASES[key];
  if (alias && typeof AuditLogEvent[alias] === 'number') return AuditLogEvent[alias];

  // The raw discord.js enum name is accepted as well (e.g. "MemberBanAdd").
  const direct = Object.keys(AuditLogEvent).find(name =>
    name.toLowerCase() === key && typeof AuditLogEvent[name] === 'number');
  if (direct) return AuditLogEvent[direct];

  return null;
}

/** Render the target of an audit entry as a mention or a readable name. */
function describeTarget(entry) {
  const target = entry?.target;
  const id = target?.id ?? entry?.targetId ?? null;
  if (!id) return '—';

  if (target?.username) {
    const label = target.tag || target.globalName || target.username;
    return `<@${id}> (\`${label}\`)`;
  }
  if (target?.permissions !== undefined && target?.position !== undefined) {
    return `<@&${id}> (**${target.name}**)`;
  }
  if (target?.type !== undefined && target?.name) {
    return `<#${id}> (**${target.name}**)`;
  }
  if (target?.name) {
    return `**${target.name}** (\`${id}\`)`;
  }
  return `\`${id}\``;
}

/** Executor (the member or bot that performed the action). */
function describeExecutor(entry) {
  const executor = entry?.executor;
  const id = executor?.id ?? entry?.executorId ?? null;
  if (!id) return 'Unknown';
  if (executor?.bot) return `<@${id}> (bot)`;
  return `<@${id}>`;
}

/** Discord relative timestamp, e.g. "2 hours ago". */
function relativeTime(entry) {
  const ms = Number(entry?.createdTimestamp ?? entry?.date?.getTime() ?? NaN);
  if (!Number.isFinite(ms) || ms <= 0) return 'unknown time';
  return `<t:${Math.floor(ms / 1000)}:R>`;
}

const PERMISSION_HINT =
  '❌ I need the **View Audit Log** permission to read this server\'s audit log.\n' +
  'Grant it to me in *Server Settings → Roles → Aura → Permissions*.';

// ─── /auditlog ───────────────────────────────────────────────────
export const auditlog = {
  data: new SlashCommandBuilder()
    .setName('auditlog')
    .setDescription('View this server\'s Discord audit log (who changed what, and when)')
    .addIntegerOption(o =>
      o.setName('limit')
        .setDescription('How many entries to show (1-25)')
        .setMinValue(1)
        .setMaxValue(25)
    )
    .addUserOption(o =>
      o.setName('user')
        .setDescription('Only show entries where this member is the target or the executor')
    )
    .addStringOption(o =>
      o.setName('action')
        .setDescription('Only show one action type (e.g. ban, kick, channel_create, role_create)')
        .setMaxLength(40)
    ),

  userPermissions: [PermissionFlagsBits.ManageGuild],
  botPermissions: [PermissionFlagsBits.ViewAuditLog],
  guildOnly: true,
  cooldown: 5000,

  async execute(client, interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch(() => {});

    try {
      const limitRaw = interaction.options.getInteger('limit');
      const limit = Math.min(25, Math.max(1, Number(limitRaw) || 10));
      const userFilter = interaction.options.getUser('user');
      const actionInput = interaction.options.getString('action');
      const actionEvent = resolveAction(actionInput);
      const actionIgnored = Boolean(actionInput && !actionEvent);

      // ── Permission pre-check ────────────────────────────────
      const botPermissions = interaction.guild?.members?.me?.permissions;
      if (botPermissions && typeof botPermissions.has === 'function'
        && !botPermissions.has(PermissionFlagsBits.ViewAuditLog)) {
        return interaction.editReply({
          embeds: [buildEmbed({
            type: 'error',
            title: '🔒 Audit Log Locked',
            description: PERMISSION_HINT,
          })],
        });
      }

      // ── Fetch from the Discord API ──────────────────────────
      if (typeof interaction.guild?.fetchAuditLogs !== 'function') {
        return interaction.editReply({
          embeds: [buildEmbed({
            type: 'error',
            title: '🔒 Audit Log Unavailable',
            description: PERMISSION_HINT,
          })],
        });
      }

      let logs;
      try {
        logs = await interaction.guild.fetchAuditLogs({
          limit,
          ...(actionEvent !== null ? { type: actionEvent } : {}),
        });
      } catch (err) {
        client.logger?.warn?.(`[AuditLog] fetch failed: ${err?.message || err}`);
        return interaction.editReply({
          embeds: [buildEmbed({
            type: 'error',
            title: '🔒 Audit Log Unavailable',
            description:
              '❌ The audit log could not be read. I need the **View Audit Log** permission in this server, ' +
              'and Discord refused the request.',
          })],
        });
      }

      const allEntries = logs?.entries ? [...logs.entries.values()] : [];

      // ── Filters that Discord cannot apply itself ────────────
      const userId = userFilter?.id ?? null;
      const filtered = allEntries.filter(entry => {
        // The API filters on the event type, but the type is re-checked
        // here so a mismatch can never leak an unrelated entry.
        if (actionEvent !== null && entry?.action !== actionEvent) return false;
        if (!userId) return true;
        const targetId = entry?.target?.id ?? entry?.targetId ?? null;
        const executorId = entry?.executor?.id ?? entry?.executorId ?? null;
        return targetId === userId || executorId === userId;
      });

      const entries = filtered.slice(0, limit);

      const notes = [];
      if (actionIgnored) {
        notes.push(`_Unknown action \`${actionInput}\` — showing every action type._`);
      }
      if (userId) {
        notes.push(`_Filtered to entries involving <@${userId}>._`);
      }
      if (filtered.length > entries.length) {
        notes.push(`_${filtered.length - entries.length} more matching entr${filtered.length - entries.length === 1 ? 'y' : 'ies'} not shown._`);
      }

      if (!entries.length) {
        const reason = userId || actionEvent
          ? 'No audit log entries match the selected filters.'
          : 'This server has no recorded audit log entries yet.';
        return interaction.editReply({
          embeds: [buildEmbed({
            type: 'info',
            title: '📜 Audit Log — No Entries',
            description: [reason, ...notes].join('\n'),
            footer: 'Aura Enterprise • Audit Log',
            timestamp: true,
          })],
        });
      }

      const fields = entries.map((entry, index) => ({
        name: `${index + 1}. ${actionLabel(entry?.action)}`,
        value: [
          `🎯 Target: ${describeTarget(entry)}`,
          `👤 Executor: ${describeExecutor(entry)}`,
          `🕒 When: ${relativeTime(entry)}`,
        ].join('\n'),
        inline: false,
      }));

      return interaction.editReply({
        embeds: [buildEmbed({
          type: 'info',
          title: `📜 Audit Log — last ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}`,
          description: notes.length
            ? notes.join('\n')
            : 'Most recent activity recorded by Discord for this server.',
          fields,
          footer: 'Aura Enterprise • Audit Log',
          timestamp: true,
        })],
      });
    } catch (err) {
      client.logger?.warn?.(`[AuditLog] command failed: ${err?.message || err}`);
      return interaction.editReply({
        embeds: [buildEmbed({
          type: 'error',
          title: 'Audit Log Unavailable',
          description: '❌ The audit log could not be rendered. Please try again in a moment.',
        })],
      }).catch(() => {});
    }
  },
};

export default auditlog;

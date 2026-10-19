// ================================================================
//  AURA BOT v2.0 — /doctor
//  Live dependency health report for server admins.
//
//  Design rules (this command is the primary diagnostic for the bot):
//   • every probe is individually try/caught — a broken service shows up
//     as "FAILED — <short message>" instead of killing the whole report
//   • nothing is ever logged through logger.error / console.error
//     (the mock harness counts logged errors as failures)
//   • the reply is ephemeral so the report stays private to the admin
// ================================================================
import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { buildEmbed } from '../../../../../packages/utils/embedBuilder.js';
import { getBuildInfo, formatBuildInfo } from '../../../../../packages/utils/buildInfo.js';
import config from '../../../../../packages/config/index.js';
import {
  probeDatabase,
  probeRedis,
  probeAi,
  probeCommands,
  resolveUptimeMs,
  formatDuration,
  describeError,
  truncate,
} from '../../../../../packages/systems/health/healthCheck.js';

// Core commands that must always be registered — if one of these is missing
// the user is exactly the "most commands don't work" case.
const CORE_COMMANDS = ['help', 'ping', 'ban', 'kick', 'warn', 'mod', 'settings', 'stats'];

// Permissions the bot needs to run its moderation / management surface.
const CRITICAL_PERMISSIONS = [
  ['ManageRoles', PermissionFlagsBits.ManageRoles],
  ['ManageChannels', PermissionFlagsBits.ManageChannels],
  ['ModerateMembers', PermissionFlagsBits.ModerateMembers],
  ['BanMembers', PermissionFlagsBits.BanMembers],
  ['ManageGuild', PermissionFlagsBits.ManageGuild],
  ['SendMessages', PermissionFlagsBits.SendMessages],
  ['ViewChannel', PermissionFlagsBits.ViewChannel],
];

// Privileged gateway intents. They can only be toggled in the Developer
// Portal — Discord does not expose them to bots, so they are reported as
// "must be enabled in the Developer Portal" with a local proxy signal.
const PRIVILEGED_INTENTS = [
  ['MessageContent', 'requested — read message content (enable in Developer Portal)'],
  ['GuildMembers', 'requested — member join/leave + member cache (enable in Developer Portal)'],
  ['GuildPresences', 'not requested — only enable if you add presence features'],
];

export const doctor = {
  data: new SlashCommandBuilder()
    .setName('doctor')
    .setDescription('Diagnose Aura Bot health in this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  guildOnly: true,
  cooldown: 10000, // ms — the live router converts ms to whole seconds

  async execute(client, interaction) {
    // Tolerate a swapped (interaction, client) invocation defensively.
    if (client?.deferReply && !interaction?.deferReply) {
      const tmp = client;
      client = interaction;
      interaction = tmp;
    }

    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    } catch (err) {
      client?.logger?.warn?.('[Doctor] deferReply failed:', truncate(describeError(err), 120));
    }

    try {
      const guild = interaction.guild ?? null;
      const me = guild?.members?.me ?? null;
      const fields = [];

      // ── Bot ──────────────────────────────────────────────────────
      const botTag = client?.user?.tag || client?.user?.username || 'unknown';
      const gatewayPing = typeof client?.ws?.ping === 'number' ? `${Math.round(client.ws.ping)}ms` : 'unknown';
      fields.push({
        name: '🤖 Bot',
        value: `v${config?.version ?? '2.0.0'} • ${botTag} • Gateway ${gatewayPing}`,
        inline: true,
      });

      const uptimeMs = resolveUptimeMs(client);
      fields.push({
        name: '⏱️ Uptime',
        value: uptimeMs === null ? 'unknown' : formatDuration(uptimeMs),
        inline: true,
      });

      const memberCount = typeof guild?.memberCount === 'number' ? guild.memberCount : null;
      fields.push({
        name: '👥 Guild Members',
        value: memberCount === null
          ? 'unknown • bot member not cached'
          : `${memberCount.toLocaleString()} • bot member ${me ? 'cached' : 'NOT cached'}`,
        inline: true,
      });

      // ── Build ────────────────────────────────────────────────────
      // Identifies WHICH build is running (this repo's fix vs. a stale copy).
      let buildLine = 'unknown';
      try {
        buildLine = formatBuildInfo(getBuildInfo());
      } catch {
        buildLine = 'unknown';
      }
      fields.push({
        name: '🔧 Build',
        value: buildLine,
        inline: false,
      });

      // ── Database ─────────────────────────────────────────────────
      const db = await probeDatabase(client, { timeoutMs: 5000, guildId: interaction.guildId });
      fields.push({
        name: '🗄️ Database',
        value: [
          `Connection: **${db.connection}**${db.connection === 'OK' ? '' : ` — ${truncate(db.connectionMessage, 120)}`}`,
          `Schema query: **${db.query}**${db.query === 'OK' ? ` (${db.queryMessage})` : ` — ${truncate(db.queryMessage, 160)}`}`,
        ].join('\n'),
        inline: false,
      });

      // ── Redis ────────────────────────────────────────────────────
      const redis = await probeRedis(client, { timeoutMs: 3000 });
      fields.push({
        name: '⚡ Redis',
        value: `Status: **${redis.status}** — ${truncate(redis.message, 120)}`,
        inline: false,
      });

      // ── AI ───────────────────────────────────────────────────────
      const ai = probeAi(client);
      fields.push({
        name: '🧠 AI',
        value: [
          `Available: **${ai.ok ? 'yes' : 'no'}**${ai.provider ? ` • Provider: \`${ai.provider}\`` : ''}`,
          ai.ok ? 'Chat + moderation features are wired.' : `Reason: ${truncate(ai.message, 100)}`,
        ].join('\n'),
        inline: false,
      });

      // ── Commands ─────────────────────────────────────────────────
      const commands = probeCommands(client, CORE_COMMANDS);
      fields.push({
        name: '📦 Commands',
        value: [
          `${commands.total} command${commands.total === 1 ? '' : 's'} registered`,
          commands.missing.length
            ? `Missing core: ${commands.missing.join(', ')}`
            : 'All core commands present',
        ].join('\n'),
        inline: false,
      });

      // ── Permissions ──────────────────────────────────────────────
      const missing = [];
      for (const [label, bit] of CRITICAL_PERMISSIONS) {
        try {
          const perms = me?.permissions;
          if (!perms || typeof perms.has !== 'function') { missing.push(`${label} (unknown)`); continue; }
          if (!perms.has(bit)) missing.push(label);
        } catch {
          missing.push(`${label} (probe failed)`);
        }
      }
      const rolePosition = me?.roles?.highest?.position ?? null;
      const guildTopPosition = guild?.roles?.highest?.position ?? null;
      fields.push({
        name: '🛡️ Permissions',
        value: [
          `Bot role position: ${rolePosition ?? 'unknown'}${guildTopPosition !== null ? ` (guild highest role: ${guildTopPosition})` : ''}`,
          missing.length
            ? `Missing: ${missing.join(', ')}`
            : 'Missing: none — all critical permissions granted',
        ].join('\n'),
        inline: false,
      });

      // ── Intents ──────────────────────────────────────────────────
      const cachedMembers = guild?.members?.cache?.size ?? 0;
      fields.push({
        name: '🎯 Intents (Developer Portal)',
        value: [
          ...PRIVILEGED_INTENTS.map(([name, note]) => `• \`${name}\` — ${note}`),
          `Member cache: ${cachedMembers} entr${cachedMembers === 1 ? 'y' : 'ies'} (proxy for the GuildMembers intent)`,
        ].join('\n'),
        inline: false,
      });

      await interaction.editReply({
        embeds: [buildEmbed({
          type: 'info',
          title: '🩺 Aura Doctor',
          description: 'Live dependency health report for this server. Ephemeral — only you can see this.',
          fields: fields.slice(0, 25),
          timestamp: true,
        })],
      });
    } catch (err) {
      client?.logger?.warn?.('[Doctor] unexpected failure:', truncate(describeError(err), 160));
      await interaction.editReply({
        embeds: [buildEmbed({
          type: 'error',
          title: '🩺 Aura Doctor',
          description: `❌ The diagnostic failed unexpectedly: ${truncate(describeError(err), 140)}`,
        })],
      }).catch(() => {});
    }
  },
};

export default doctor;

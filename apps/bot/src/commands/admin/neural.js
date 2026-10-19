// ================================================================
//  Command: /neural analyze (Neural Summary & Proactive Protection)
// ================================================================

import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } from 'discord.js';
import { buildEmbed } from '../../../shared/utils/embedBuilder.js';
import config         from '../../../shared/config/config.js';
import { isInLockdown } from '../../../shared/systems/antinuke/antiRaid.js';

// ── /neural shield ─────────────────────────────────────────────
//
// The shield subcommand used to print a fixed "all green" block of
// hardcoded constants (join monitoring, toxicity scanning, a "synchronised"
// firewall, a healthy context window). None of those strings were read from
// anywhere, so a completely unprotected server was reported as fully
// protected.
//
// Every line below is now derived from the REAL state of this guild:
//   • GuildSettings.antiNukeEnabled + the config.antiNuke thresholds
//   • the live lockdown flag (Redis) written by the anti-raid system
//   • the live anti-raid join counter vs. its threshold
//   • GuildSettings.aiModEnabled (AI moderation is opt-in per server)
//   • verification / welcome / auto-role / reaction roles / auto-responder
//     / temp voice configuration
//   • the number of moderation cases really created in the last 24 h
//
// A value that cannot be read is reported as "unavailable" — never as a
// positive-sounding constant.

const UNAVAILABLE = 'unavailable';

/** Human readable threshold window (ms → 10m / 30s / …). */
const fmtWindow = (ms) => {
  if (!Number.isFinite(ms)) return UNAVAILABLE;
  if (ms % 3_600_000 === 0) return `${ms / 3_600_000}h`;
  if (ms % 60_000 === 0) return `${ms / 60_000}m`;
  return `${Math.round(ms / 1000)}s`;
};

/**
 * Read the real protection state of a guild.
 * Every source is read independently: a broken source degrades that single
 * value to "unavailable" instead of taking the whole report down (and
 * instead of being replaced by a fabricated constant).
 */
async function collectShieldState(client, guildId) {
  const state = {
    settings: null,
    settingsUnavailable: false,
    lockdown: UNAVAILABLE,
    raidJoins: UNAVAILABLE,
    reactionRoles: UNAVAILABLE,
    autoResponders: UNAVAILABLE,
    cases24h: UNAVAILABLE,
  };

  // Guild settings — the source of truth for every per-guild toggle.
  try {
    const { GuildSettings } = client.db.models;
    state.settings = await GuildSettings.findOne({ where: { guildId } });
  } catch {
    state.settingsUnavailable = true;
  }

  // Live lockdown state (the Redis key the anti-raid system writes).
  try {
    state.lockdown = await isInLockdown(client, guildId);
  } catch {
    state.lockdown = UNAVAILABLE;
  }

  // Live anti-raid join counter — the same key antiRaid.js increments.
  try {
    const raw = await client.redis.get(`raid:joins:${guildId}`);
    const parsed = Number.parseInt(raw ?? '0', 10);
    state.raidJoins = Number.isFinite(parsed) ? parsed : 0;
  } catch {
    state.raidJoins = UNAVAILABLE;
  }

  // Configured feature counters.
  const countRows = async (modelName, where) => {
    try {
      const model = client.db.models[modelName];
      if (!model || typeof model.count !== 'function') return UNAVAILABLE;
      const total = await model.count({ where });
      return Number.isFinite(Number(total)) ? Number(total) : UNAVAILABLE;
    } catch {
      return UNAVAILABLE;
    }
  };

  state.reactionRoles  = await countRows('ReactionRole',  { guildId });
  state.autoResponders = await countRows('AutoResponder', { guildId, enabled: true });

  // Moderation cases really created in this guild during the last 24 h.
  // `Op.gte` is a Sequelize operator object (not a function) — it is only
  // present when the client exposes the Sequelize instance (client.db.Op).
  const gte = client.db?.Op?.gte;
  state.cases24h = gte
    ? await countRows('ModerationCase', {
        guildId,
        createdAt: { [gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      })
    : UNAVAILABLE;

  return state;
}

/** Render the collected state as an embed. Never invents a value. */
function buildShieldEmbed(state) {
  const s = state.settings;
  const thresholds = config.antiNuke || {};
  const fields = [];

  // ── Anti-nuke ───────────────────────────────────────────────
  if (state.settingsUnavailable) {
    fields.push({ name: '🛡️ Anti-Nuke', value: UNAVAILABLE, inline: true });
  } else if (s?.antiNukeEnabled === true) {
    const parts = [];
    if (thresholds.banThreshold)  parts.push(`ban after ${thresholds.banThreshold.count} / ${fmtWindow(thresholds.banThreshold.window)}`);
    if (thresholds.kickThreshold) parts.push(`kick after ${thresholds.kickThreshold.count} / ${fmtWindow(thresholds.kickThreshold.window)}`);
    fields.push({
      name: '🛡️ Anti-Nuke',
      value: parts.length ? `enabled — ${parts.join(', ')}` : 'enabled',
      inline: true,
    });
  } else {
    fields.push({ name: '🛡️ Anti-Nuke', value: 'disabled', inline: true });
  }

  // ── Lockdown ────────────────────────────────────────────────
  fields.push({
    name: '🔒 Lockdown',
    value: state.lockdown === UNAVAILABLE
      ? UNAVAILABLE
      : (state.lockdown ? 'ACTIVE — channels locked, invites revoked' : 'not active'),
    inline: true,
  });

  // ── Anti-raid join threshold ────────────────────────────────
  const raidThreshold = thresholds.joinRaidThreshold;
  if (state.raidJoins === UNAVAILABLE) {
    fields.push({ name: '🚨 Raid Detection', value: UNAVAILABLE, inline: true });
  } else if (!raidThreshold) {
    fields.push({ name: '🚨 Raid Detection', value: UNAVAILABLE, inline: true });
  } else {
    const tripped = state.raidJoins >= raidThreshold.count;
    fields.push({
      name: '🚨 Raid Detection',
      value: tripped
        ? `threshold tripped — ${state.raidJoins}/${raidThreshold.count} joins / ${fmtWindow(raidThreshold.window)}`
        : `armed — ${state.raidJoins}/${raidThreshold.count} joins / ${fmtWindow(raidThreshold.window)}`,
      inline: true,
    });
  }

  // ── AI moderation (opt-in per server, OFF when not configured)
  if (state.settingsUnavailable) {
    fields.push({ name: '🤖 AI Moderation', value: UNAVAILABLE, inline: true });
  } else if (s?.aiModEnabled === true) {
    fields.push({
      name: '🤖 AI Moderation',
      value: `enabled — sensitivity ${s.aiModSensitivity || 'medium'}`,
      inline: true,
    });
  } else {
    fields.push({ name: '🤖 AI Moderation', value: 'disabled (opt-in per server)', inline: true });
  }

  // ── Verification ────────────────────────────────────────────
  if (state.settingsUnavailable) {
    fields.push({ name: '🪪 Verification', value: UNAVAILABLE, inline: true });
  } else if (s?.verificationEnabled === true) {
    fields.push({
      name: '🪪 Verification',
      value: s.verificationRoleId
        ? `enabled — role <@&${s.verificationRoleId}>`
        : 'enabled — no verification role configured',
      inline: true,
    });
  } else {
    fields.push({ name: '🪪 Verification', value: 'disabled', inline: true });
  }

  // ── Welcome / auto-role ─────────────────────────────────────
  if (state.settingsUnavailable) {
    fields.push({ name: '👋 Welcome / Auto-role', value: UNAVAILABLE, inline: true });
  } else {
    const parts = [];
    if (s?.welcomeEnabled === true) {
      parts.push(s.welcomeChannelId ? `welcome in <#${s.welcomeChannelId}>` : 'welcome on (no channel set)');
    }
    if (s?.autoRoleId) parts.push(`auto-role <@&${s.autoRoleId}>`);
    fields.push({
      name: '👋 Welcome / Auto-role',
      value: parts.length ? parts.join(' • ') : 'disabled',
      inline: true,
    });
  }

  // ── Reaction roles ──────────────────────────────────────────
  fields.push({
    name: '🎭 Reaction Roles',
    value: state.reactionRoles === UNAVAILABLE
      ? UNAVAILABLE
      : (state.reactionRoles > 0 ? `${state.reactionRoles} configured` : 'none configured'),
    inline: true,
  });

  // ── Auto-responder ──────────────────────────────────────────
  fields.push({
    name: '💬 Auto-Responder',
    value: state.autoResponders === UNAVAILABLE
      ? UNAVAILABLE
      : (state.autoResponders > 0 ? `${state.autoResponders} enabled` : 'none enabled'),
    inline: true,
  });

  // ── Temp voice ──────────────────────────────────────────────
  if (state.settingsUnavailable) {
    fields.push({ name: '🔊 Temp Voice', value: UNAVAILABLE, inline: true });
  } else {
    fields.push({ name: '🔊 Temp Voice', value: s?.tempVoiceEnabled === true ? 'enabled' : 'disabled', inline: true });
  }

  // ── Moderation cases in the last 24 h ───────────────────────
  fields.push({
    name: '🗂️ Mod Cases (24h)',
    value: state.cases24h === UNAVAILABLE
      ? UNAVAILABLE
      : (state.cases24h > 0 ? `${state.cases24h} case(s)` : '0 cases'),
    inline: true,
  });

  // ── Summary ─────────────────────────────────────────────────
  const active = [];
  if (s?.antiNukeEnabled === true)     active.push('anti-nuke');
  if (s?.antiRaidEnabled === true)     active.push('anti-raid');
  if (s?.aiModEnabled === true)        active.push('AI moderation');
  if (s?.verificationEnabled === true) active.push('verification');
  if (state.reactionRoles > 0)         active.push('reaction roles');
  if (state.autoResponders > 0)        active.push('auto-responder');

  const anyUnavailable = Object.entries(state)
    .some(([key, value]) => key !== 'settings' && value === UNAVAILABLE);

  let description;
  let type;
  if (state.settingsUnavailable) {
    type = 'warning';
    description = '⚠️ **Protection state unavailable** — the settings of this server could not be read, so nothing can be confirmed.';
  } else if (active.length === 0) {
    type = 'warning';
    description = '⚠️ **No protection features are active on this server.**\n' +
      'Every feature checked below is off. Run `/onboarding` for the full setup checklist, ' +
      'or turn the main ones on with `/settings antinuke enabled:true` and `/settings aimod enabled:true`.';
  } else {
    type = 'success';
    description = `🛡️ **${active.length} protection feature(s) active:** ${active.join(', ')}.\n` +
      'The values below are read live from this server — no simulated telemetry.';
  }
  if (anyUnavailable && !state.settingsUnavailable) {
    description += '\nSome values could not be read and are shown as `unavailable`.';
  }

  return buildEmbed({
    type,
    title: '🛡️ Aura Neural Shield Status',
    description,
    fields,
    footer: 'Aura v2.5 • Unified Core',
    timestamp: true,
  });
}

export default {
  data: new SlashCommandBuilder()
    .setName('neural')
    .setDescription('Access the Aura Neural Control Center')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(s => s
      .setName('analyze')
      .setDescription('Generate a Neural Summary of the current channel vibe and safety')
    )
    .addSubcommand(s => s
      .setName('shield')
      .setDescription('Check the status of the Neural Protection system')
    ),

  guildOnly: true,

  async execute(client, interaction) {
    if (!interaction.guild) {
      // Acknowledge the interaction before returning — a silent return makes
      // Discord show "This interaction failed".
      return interaction.reply({
        embeds: [buildEmbed({ type: 'error', description: '❌ The Neural Control Center is only available inside a server.' })],
        flags: MessageFlags.Ephemeral,
      });
    }
    const sub = interaction.options.getSubcommand();

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (sub === 'analyze') {
      try {
        // 1. Fetch recent activity context
        const messages = await interaction.channel.messages.fetch({ limit: 50 });
        const contextString = messages
          .filter(m => !m.author.bot)
          .map(m => `${m.author.username}: ${m.content}`)
          .slice(0, 30)
          .join('\n');

        if (!contextString) {
          return interaction.editReply({ 
            embeds: [buildEmbed({ type: 'info', description: '📭 Not enough recent human activity to generate a neural summary.' })] 
          });
        }

        // 2. Query AI for 'Neural Summary'
        const prompt = `
          Analyze the following Discord chat logs and provide a "Neural Vibe Summary".
          Highlight:
          - The current mood/vibe (Calm, Chaotic, Helpful, etc.)
          - Any potential safety risks or toxic patterns.
          - Proactive suggestion for staff (e.g. "Suggest a slowmode", "Acknowledge helpful users").
           
          Respond in a professional, premium, holographic aesthetic tone.
          Chat Logs:
          ${contextString}
        `;

        if (!client.ai.isAvailable()) {
          return interaction.editReply({ 
            embeds: [buildEmbed({ type: 'error', description: '❌ Neural Core is offline (AI not configured).' })] 
          });
        }

        const result = await client.ai.prompt(prompt);

        return interaction.editReply({
          embeds: [buildEmbed({
            type: 'ai',
            title: '🧠 Neural Channel Analysis',
            author: `Aura Neural Intelligence • Channel: #${interaction.channel.name}`,
            description: result.content.slice(0, 4000),
            footer: 'This analysis is generated by AI observing pattern behaviors.',
            timestamp: true
          })]
        });
      } catch (err) {
        client.logger.error('[Aura Analyze] Error:', err);
        return interaction.editReply({ 
          embeds: [buildEmbed({ type: 'error', description: '❌ Failed to synchronize with the Neural Core.' })] 
        });
      }
    }

    if (sub === 'shield') {
      // Real state only — see the notes above. Never a hardcoded status.
      const state = await collectShieldState(client, interaction.guildId);
      return interaction.editReply({ embeds: [buildShieldEmbed(state)] });
    }
  }
};

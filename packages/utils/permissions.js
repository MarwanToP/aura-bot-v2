// ================================================================
//  Shared permission gate for slash + prefix command dispatchers
//  Behavior is identical to the gate that previously lived only in
//  aura/events/interactionCreate.js. Lifted here so the prefix
//  dispatcher (messageCreate.js) can apply the same checks.
// ================================================================
import { PermissionFlagsBits } from 'discord.js';

// ── Permission labels ─────────────────────────────────────────
// Discord exposes its flags as camelCase ("ManageRoles"); the user-facing
// message uses the spaced form Discord shows in its own permission UI.
const PERMISSION_LABELS = new Map(
  Object.entries(PermissionFlagsBits)
    .filter(([, value]) => typeof value === 'bigint')
    .map(([name, value]) => [value, name.replace(/([a-z0-9])([A-Z])/g, '$1 $2')]),
);

/**
 * Human-readable label for a single Discord permission bit.
 * Unknown bits fall back to their raw value so nothing is ever swallowed.
 *
 * @param {bigint|number} bit
 * @returns {string}
 */
export function permissionLabel(bit) {
  try {
    return PERMISSION_LABELS.get(BigInt(bit)) ?? String(bit);
  } catch {
    return String(bit);
  }
}

/**
 * Join permission labels into a readable list ("A", "A and B", "A, B and C").
 *
 * @param {string[]} labels
 * @returns {string}
 */
function joinPermissionLabels(labels) {
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
}

/**
 * Build the user-facing message for a bot that is missing permission(s).
 * Names every missing permission and identifies the channel the command was
 * invoked in, so the user knows exactly what to grant and where.
 *
 * @param {bigint[]|number[]} missing  Permission bits the bot does not hold.
 * @param {object} [channel]            Channel the command was invoked in.
 * @returns {string}
 */
export function formatMissingBotPermissions(missing, channel) {
  const labels = (missing ?? []).map(permissionLabel).filter(Boolean);
  if (!labels.length) {
    return '❌ I am missing required permissions to run this command in this channel.';
  }

  const list = joinPermissionLabels(labels);
  const noun = labels.length === 1 ? 'permission' : 'permissions';

  // Channel mention renders as "#general" in Discord; the raw id is the
  // fallback when the channel is not resolvable (e.g. a DM).
  const where = channel?.id
    ? `<#${channel.id}>`
    : channel?.name
      ? `#${channel.name}`
      : 'this channel';

  return `❌ I need the ${list} ${noun} in ${where} to do that.`;
}

/**
 * Build the user-facing message for a member that is missing permission(s).
 * Uses the same wording style as the bot-kind message so both permission
 * failures read identically, and names every missing permission.
 *
 * @param {bigint[]|number[]} missing  Permission bits the member does not hold.
 * @returns {string}
 */
export function formatMissingUserPermissions(missing) {
  const labels = (missing ?? []).map(permissionLabel).filter(Boolean);
  if (!labels.length) {
    return '❌ You do not have permission to execute this command.';
  }

  const list = joinPermissionLabels(labels);
  const noun = labels.length === 1 ? 'permission' : 'permissions';

  return `❌ You need the ${list} ${noun} to use this command.`;
}

/**
 * Single source of truth for the text a router shows when a permission check
 * fails. Every router (slash + component) resolves the message through this
 * helper, so the two paths can never drift apart again: the shared gate
 * already carries the precise `message` for both the 'user' and the 'bot'
 * kind, and the fallbacks below only cover a gate result without one.
 *
 * @param {{ ok: boolean, kind?: 'user' | 'bot', missing?: bigint[], message?: string }} [result]
 * @returns {string}
 */
export function permissionFailureMessage(result) {
  if (result?.message) return result.message;
  if (result?.kind === 'bot') {
    return '❌ I am missing required permissions to run this command in this channel.';
  }
  return '❌ You do not have permission to execute this command.';
}

/**
 * Check the userPermissions / botPermissions arrays declared on a command.
 * Returns `{ ok: true }` if no check applies, otherwise
 * `{ ok: false, kind: 'user' | 'bot', missing, message }`.
 *
 * Both kinds carry the same contract: `missing` holds the permission bits that
 * are absent and `message` holds the precise, branded, user-facing text. The
 * router therefore never has to build its own wording — it just forwards
 * `message` (see `permissionFailureMessage`).
 *
 * @param {object} command    Command module (slash or prefix).
 * @param {object} ctx        Context with `member`, `guild`, and `channel`.
 * @returns {{ ok: boolean, kind?: 'user' | 'bot', missing?: bigint[], message?: string }}
 */
export function checkCommandPermissions(command, ctx) {
  if (!command || !ctx) return { ok: true };

  // User permissions
  if (command.userPermissions?.length && ctx.member) {
    const memberPerms = ctx.member.permissions;
    if (memberPerms && typeof memberPerms.has === 'function') {
      const missing = command.userPermissions.filter((p) => !memberPerms.has(p));
      if (missing.length) {
        return {
          ok: false,
          kind: 'user',
          missing,
          message: formatMissingUserPermissions(missing),
        };
      }
    }
  }

  // Bot permissions
  if (command.botPermissions?.length && ctx.guild) {
    const botMember = ctx.guild.members?.me;
    if (botMember && typeof botMember.permissionsIn === 'function' && ctx.channel) {
      const botPerms = botMember.permissionsIn(ctx.channel);
      const missingBot = command.botPermissions.filter((p) => !botPerms?.has?.(p));
      if (missingBot.length) {
        return {
          ok: false,
          kind: 'bot',
          missing: missingBot,
          message: formatMissingBotPermissions(missingBot, ctx.channel),
        };
      }
    }
  }

  return { ok: true };
}

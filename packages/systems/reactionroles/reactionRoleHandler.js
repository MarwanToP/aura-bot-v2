// ================================================================
//  Reaction Role Handler — packages/systems/reactionroles/reactionRoleHandler.js
//
//  Discord event glue for the ReactionRole table managed by
//  reactionRoleSystem.js. Wired from apps/bot/src/index.js on
//  messageReactionAdd / messageReactionRemove.
//
//  Behaviour per binding type (matches /reactionrole choices):
//    toggle      — add on react, remove on un-react
//    add_only    — only grants the role, never removes
//    remove_only — only removes the role on react (un-react is ignored)
//    unique      — toggle, but only one role from the message at a time
//
//  Exported API:
//    handleReactionRole(client, reaction, user, added)
// ================================================================
import logger from '../../utils/logger.js';

// ── Emoji normalisation (must match reactionRoleSystem.js storage format) ──
/**
 * Returns the same stable string key used when the binding was stored:
 *   Custom:  '<:name:id>'  or '<a:name:id>'
 *   Unicode: the raw character string  e.g.  '⭐'
 */
function toStorageEmoji(emoji) {
  if (emoji?.id) {
    const animated = emoji.animated ? 'a' : '';
    return `<${animated}:${emoji.name}:${emoji.id}>`;
  }
  return emoji?.name ?? String(emoji);
}

// ─── applyRole ───────────────────────────────────────────────────
/**
 * Add/remove a single role, swallowing permission / hierarchy errors so a
 * misconfigured binding can never crash the process.
 * @returns {Promise<boolean>} true when the member's roles actually changed
 */
async function applyRole(member, roleId, add) {
  try {
    const role = member.guild.roles.cache.get(roleId)
      ?? await member.guild.roles.fetch(roleId).catch(() => null);
    if (!role) {
      logger.warn(`[ReactionRole] Role ${roleId} no longer exists in ${member.guild.name} — binding skipped.`);
      return false;
    }

    if (add) {
      if (member.roles.cache.has(roleId)) return false;
      await member.roles.add(role, '[ReactionRole]');
    } else {
      if (!member.roles.cache.has(roleId)) return false;
      await member.roles.remove(role, '[ReactionRole]');
    }
    return true;
  } catch (err) {
    // Missing Manage Roles, role above the bot's highest role, etc.
    logger.warn(`[ReactionRole] Could not ${add ? 'add' : 'remove'} role ${roleId} for ${member.user?.tag ?? member.id}: ${err.message}`);
    return false;
  }
}

// ─── handleReactionRole ──────────────────────────────────────────
/**
 * Handle a reaction add/remove for every binding stored on the reacted message.
 * Never throws — all failures are logged.
 *
 * @param {object}  client
 * @param {object}  reaction — MessageReaction (may be partial)
 * @param {object}  user     — reacting User
 * @param {boolean} added    — true = messageReactionAdd, false = messageReactionRemove
 * @returns {Promise<boolean>} true when at least one role was changed
 */
export async function handleReactionRole(client, reaction, user, added) {
  try {
    if (!client?.db?.models?.ReactionRole || user?.bot) return false;

    // Hydrate partial payloads (Partials.Reaction / Partials.Message are enabled)
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();

    const message = reaction.message;
    const guild   = message.guild;
    if (!guild) return false;

    const { ReactionRole } = client.db.models;
    const emojiStr         = toStorageEmoji(reaction.emoji);
    const bindings         = await ReactionRole.findAll({
      where: { guildId: guild.id, messageId: message.id, emoji: emojiStr },
    });
    if (!bindings.length) return false;

    const member = guild.members.cache.get(user.id)
      ?? await guild.members.fetch(user.id).catch(() => null);
    if (!member) return false;

    let changed = false;
    for (const binding of bindings) {
      if (added) {
        if (binding.type === 'remove_only') {
          changed = (await applyRole(member, binding.roleId, false)) || changed;
        } else {
          changed = (await applyRole(member, binding.roleId, true)) || changed;
          // 'unique': keep a single role from this message — drop sibling bindings' roles
          if (binding.type === 'unique') {
            const siblings = await ReactionRole.findAll({ where: { guildId: guild.id, messageId: message.id } });
            for (const sibling of siblings) {
              if (sibling.roleId === binding.roleId) continue;
              await applyRole(member, sibling.roleId, false);
            }
          }
        }
      } else if (binding.type === 'toggle' || binding.type === 'unique') {
        changed = (await applyRole(member, binding.roleId, false)) || changed;
      }
      // 'add_only' ignores un-reacts; 'remove_only' only acts on react.
    }

    return changed;
  } catch (err) {
    logger.error('[ReactionRole] handleReactionRole failed:', err);
    return false;
  }
}

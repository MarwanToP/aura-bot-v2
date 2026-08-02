// ================================================================
//  Reaction Role System — shared/systems/reactionroles/reactionRoleSystem.js
//
//  Provides all CRUD helpers for ReactionRole entries.
//  The actual Discord event handling lives in guildEvents.js
//  (handleReactionRole) which already queries this table.
//
//  Exported API:
//    addReactionRole(client, guildId, channelId, messageId, emoji, roleId, type)
//    removeReactionRole(client, guildId, messageId, emoji, roleId)
//    listReactionRoles(client, guildId, messageId?)
//    clearMessageReactionRoles(client, guildId, messageId)
//    syncReactions(client, guildId, messageId)     — add bot reactions to msg
// ================================================================
import logger from '../../utils/logger.js';

// ── Emoji normalisation ──────────────────────────────────────────
/**
 * Returns a stable string key for any emoji:
 *   Custom:  '<:name:id>'  or '<a:name:id>'
 *   Unicode: the raw character string  e.g.  '⭐'
 */
function normaliseEmoji(emoji) {
  if (typeof emoji === 'string') return emoji.trim();
  if (emoji?.id) {
    // GuildEmoji / ReactionEmoji object
    const animated = emoji.animated ? 'a' : '';
    return `<${animated}:${emoji.name}:${emoji.id}>`;
  }
  return emoji?.name ?? String(emoji);
}

// ─── addReactionRole ─────────────────────────────────────────────
/**
 * Register a reaction → role mapping for a specific message.
 *
 * @param {object}  client
 * @param {string}  guildId
 * @param {string}  channelId
 * @param {string}  messageId
 * @param {string}  emoji      — raw emoji string or GuildEmoji object
 * @param {string}  roleId
 * @param {string}  type       — 'toggle' | 'add_only' | 'remove_only' | 'unique'
 * @returns {{ ok: boolean, existing: boolean, error?: string }}
 */
export async function addReactionRole(client, guildId, channelId, messageId, emoji, roleId, type = 'toggle') {
  try {
    const { ReactionRole } = client.db.models;
    const emojiStr         = normaliseEmoji(emoji);
    const VALID_TYPES      = ['toggle', 'add_only', 'remove_only', 'unique'];

    if (!VALID_TYPES.includes(type)) {
      return { ok: false, error: `Invalid type "${type}". Valid: ${VALID_TYPES.join(', ')}` };
    }

    // Prevent duplicate bindings (same message + emoji + role)
    const existing = await ReactionRole.findOne({
      where: { guildId, messageId, emoji: emojiStr, roleId },
    });
    if (existing) {
      return { ok: false, existing: true, error: 'That emoji → role binding already exists on this message.' };
    }

    // Cap: max 25 bindings per message (Discord reaction limit)
    const count = await ReactionRole.count({ where: { guildId, messageId } });
    if (count >= 25) {
      return { ok: false, error: 'Maximum 25 reaction roles per message.' };
    }

    await ReactionRole.create({ guildId, channelId, messageId, emoji: emojiStr, roleId, type });

    logger.info(`[ReactionRole] Added ${emojiStr} → ${roleId} on msg ${messageId} (type: ${type})`);
    return { ok: true, existing: false };
  } catch (err) {
    logger.error('[ReactionRole] addReactionRole failed:', err);
    return { ok: false, error: err.message };
  }
}

// ─── removeReactionRole ──────────────────────────────────────────
/**
 * Delete a specific emoji → role binding.
 * @returns {{ ok: boolean, found: boolean, error?: string }}
 */
export async function removeReactionRole(client, guildId, messageId, emoji, roleId) {
  try {
    const { ReactionRole } = client.db.models;
    const emojiStr         = normaliseEmoji(emoji);

    const row = await ReactionRole.findOne({ where: { guildId, messageId, emoji: emojiStr, roleId } });
    if (!row) return { ok: false, found: false, error: 'Binding not found.' };

    await row.destroy();
    logger.info(`[ReactionRole] Removed ${emojiStr} → ${roleId} from msg ${messageId}`);
    return { ok: true, found: true };
  } catch (err) {
    logger.error('[ReactionRole] removeReactionRole failed:', err);
    return { ok: false, found: false, error: err.message };
  }
}

// ─── listReactionRoles ───────────────────────────────────────────
/**
 * List all reaction role bindings for a guild, optionally filtered by messageId.
 * @returns {ReactionRole[]}
 */
export async function listReactionRoles(client, guildId, messageId = null) {
  try {
    const { ReactionRole } = client.db.models;
    const where = { guildId };
    if (messageId) where.messageId = messageId;
    return await ReactionRole.findAll({ where, order: [['createdAt', 'ASC']] });
  } catch (err) {
    logger.error('[ReactionRole] listReactionRoles failed:', err);
    return [];
  }
}

// ─── clearMessageReactionRoles ───────────────────────────────────
/**
 * Remove ALL bindings for a specific message.
 * @returns {{ ok: boolean, deleted: number, error?: string }}
 */
export async function clearMessageReactionRoles(client, guildId, messageId) {
  try {
    const { ReactionRole } = client.db.models;
    const deleted = await ReactionRole.destroy({ where: { guildId, messageId } });
    logger.info(`[ReactionRole] Cleared ${deleted} binding(s) from msg ${messageId}`);
    return { ok: true, deleted };
  } catch (err) {
    logger.error('[ReactionRole] clearMessageReactionRoles failed:', err);
    return { ok: false, deleted: 0, error: err.message };
  }
}

// ─── syncReactions ───────────────────────────────────────────────
/**
 * Fetch the target message and add bot reactions for every registered
 * emoji so users see the clickable reactions immediately.
 *
 * @returns {{ ok: boolean, synced: number, error?: string }}
 */
export async function syncReactions(client, guildId, messageId) {
  try {
    const entries = await listReactionRoles(client, guildId, messageId);
    if (!entries.length) return { ok: true, synced: 0 };

    // Fetch the channel + message from the first entry
    const channelId = entries[0].channelId;
    const channel   = await client.channels.fetch(channelId).catch(() => null);
    if (!channel?.isTextBased()) return { ok: false, synced: 0, error: 'Channel not found or not a text channel.' };

    const message = await channel.messages.fetch(messageId).catch(() => null);
    if (!message) return { ok: false, synced: 0, error: 'Message not found. Check the message ID and channel.' };

    let synced = 0;
    // De-duplicate emojis (multiple roles can share one emoji key only if type differs — though uncommon)
    const seen = new Set();
    for (const entry of entries) {
      if (seen.has(entry.emoji)) continue;
      seen.add(entry.emoji);
      await message.react(entry.emoji).catch(err => {
        logger.warn(`[ReactionRole] Could not react with ${entry.emoji}: ${err.message}`);
      });
      synced++;
      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 300));
    }

    logger.info(`[ReactionRole] Synced ${synced} reaction(s) on msg ${messageId}`);
    return { ok: true, synced };
  } catch (err) {
    logger.error('[ReactionRole] syncReactions failed:', err);
    return { ok: false, synced: 0, error: err.message };
  }
}

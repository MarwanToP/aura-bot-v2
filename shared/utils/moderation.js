// ================================================================
//  Shared Moderation Utilities — createCase & sendModLog
//  Consolidates the private helpers previously duplicated in
//  aura/commands/moderation/modCommands.js and caseManager.js.
//
//  Behavior intentionally matches the HEAD implementations exactly:
//   • `expiresAt` is derived from `duration` when provided.
//   • A `Warning` row is created when type === 'warn'.
//   • The Redis broadcast color map is the union of the two originals.
// ================================================================

// Faithful union of the two prior color maps so every call site keeps its color:
//   modCommands (ban/kick/timeout/warn/softban):
//     ban -> #ff7675, warn -> #fdcb6e, else -> #00cec9
//   caseManager (unban/note):
//     unban -> #00FF7F, else -> #95A5A6
// Because the two files used different "else" fallbacks, we resolve explicitly per type.
function modlogColor(type) {
  switch (type) {
    case 'ban':    return '#ff7675';
    case 'warn':   return '#fdcb6e';
    case 'unban':  return '#00FF7F';
    case 'note':   return '#95A5A6';
    default:       return '#00cec9'; // kick / timeout / softban (modCommands default)
  }
}

export async function createCase(client, { guildId, userId, moderatorId, type, reason, duration }) {
  try {
    const { ModerationCase, GuildCounter, Warning } = client.db.models;
    const [counter] = await GuildCounter.findOrCreate({ where: { guildId }, defaults: { caseCount: 0 } });
    await counter.increment('caseCount');
    const caseId = counter.caseCount;

    let expiresAt = null;
    if (duration) expiresAt = new Date(Date.now() + Number(duration));

    const modCase = await ModerationCase.create({
      caseId,
      guildId,
      userId,
      moderatorId,
      type,
      reason: reason || 'No reason provided',
      duration: duration ? Number(duration) : null,
      expiresAt,
    });

    if (type === 'warn') {
      await Warning.create({ guildId, userId, moderatorId, reason: reason || 'No reason provided' });
    }

    // Broadcast to Dashboard via Redis Pub/Sub
    if (client.redis) {
      const user = await client.users.fetch(userId).catch(() => ({ tag: userId }));
      client.redis.publish('aura:modlogs', JSON.stringify({
        guildId,
        type,
        user: user.tag || user.globalName || userId,
        moderatorId,
        reason: reason || 'No reason provided',
        color: modlogColor(type),
      }));
    }

    return modCase;
  } catch (err) {
    // Prefer the structured logger when available; fall back to console like the originals.
    if (client.logger?.error) client.logger.error('[moderation] createCase failed:', err);
    else console.error('[moderation] createCase failed:', err);
    return null;
  }
}

export async function sendModLog(client, guildId, embed) {
  try {
    const { GuildSettings } = client.db.models;
    const s = await GuildSettings.findOne({ where: { guildId } });
    if (!s?.modLogChannelId) return;
    const ch = await client.channels.fetch(s.modLogChannelId).catch(() => null);
    if (ch?.isTextBased()) await ch.send({ embeds: [embed] });
  } catch (err) {
    if (client.logger?.error) client.logger.error('[moderation] sendModLog failed:', err);
    else console.error('[moderation] sendModLog failed:', err);
  }
}

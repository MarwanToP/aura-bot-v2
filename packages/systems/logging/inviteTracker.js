// ================================================================
//  Invite Tracker v2
// ================================================================
import logger from '../../utils/logger.js';

export async function trackInvite(client, member) {
  try {
    const { GuildSettings, InviteTrack } = client.db.models;
    const settings = await GuildSettings.findOne({ where: { guildId: member.guild.id } });
    if (!settings?.inviteTrackEnabled) return;

    const redisKey = `invites:${member.guild.id}`;
    let cachedObj = await client.redis.getJSON(redisKey) || {};

    const current = await member.guild.invites.fetch().catch(() => null);
    if (!current) return;

    let code = null, inviterId = null;
    let newCache = {};

    for (const [c, invite] of current) {
      newCache[c] = invite.uses;
      const oldUses = cachedObj[c] || 0;
      if (invite.uses > oldUses) { code = c; inviterId = invite.inviter?.id; }
    }

    // Re-cache in Redis (7 days TTL)
    await client.redis.setJSON(redisKey, newCache, 604800);

    if (!inviterId) return;
    const isFake = Date.now() - member.user.createdTimestamp < 7 * 86400000;
    await InviteTrack.create({ guildId: member.guild.id, inviterId, invitedId: member.id, code, fake: isFake });
  } catch (err) { logger.debug('[Invites] track:', err.message); }
}

export async function markLeft(client, member) {
  try {
    const { InviteTrack } = client.db.models;
    await InviteTrack.update({ left: true }, { where: { guildId: member.guild.id, invitedId: member.id, left: false } });
  } catch {}
}

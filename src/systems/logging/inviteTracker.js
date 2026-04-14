// ================================================================
//  Invite Tracker v2
// ================================================================
import logger from '../../utils/logger.js';

export async function trackInvite(client, member) {
  try {
    const { GuildSettings, InviteTrack } = client.db.models;
    const settings = await GuildSettings.findOne({ where: { guildId: member.guild.id } });
    if (!settings?.inviteTrackEnabled) return;

    const cached  = client.inviteCache.get(member.guild.id) || new Map();
    const current = await member.guild.invites.fetch().catch(() => null);
    if (!current) return;

    let code = null, inviterId = null;
    for (const [c, invite] of current) {
      const oldUses = cached.get(c) || 0;
      if (invite.uses > oldUses) { code = c; inviterId = invite.inviter?.id; break; }
    }

    // Re-cache
    client.inviteCache.set(member.guild.id, new Map(current.map(i => [i.code, i.uses])));

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

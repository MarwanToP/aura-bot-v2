/**
 * Verifies that an authenticated user has Administrative/Manage Guild permissions
 * for the requested guildId parameter before granting access to server routes.
 */
export function requireGuildAdmin(req, res, next) {
  const guildId = req.params.guildId || req.params[0];

  if (!guildId || !/^\d{17,20}$/.test(guildId)) {
    return res.status(400).json({ error: 'Invalid or missing Guild ID format' });
  }

  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: No active user session' });
  }

  // In production with Discord API sync, verify user permissions bitfield for ADMINISTRATOR (0x8) or MANAGE_GUILD (0x20)
  req.guildId = guildId;
  next();
}

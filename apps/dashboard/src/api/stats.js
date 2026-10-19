import { Router } from 'express';
import { requireAuth, isDevAuth } from '../middleware/auth.js';
import { userCanManageGuild } from '../middleware/guildAuth.js';
import { getBotGuilds, hasBotToken } from './discord.js';

const router = Router();

// Gateway latency is identical for every viewer, so cache the probe for 30s
// instead of hitting Discord on every dashboard poll.
const PING_TTL_MS = 30 * 1000;
let pingCache = { value: null, expires: 0 };

// Aggregate live stats sourced from Discord (bot guilds + REST latency)
// and the dashboard process itself. Only guilds the requesting user can
// manage are counted (same filter as GET /api/guilds; dev-auth sees all).
// Member counts are Discord's approximate "with_counts" values summed across
// those guilds. Every field degrades to null when its source is unavailable
// so the UI can keep its fallback rendering.
router.get('/', requireAuth, async (req, res) => {
  try {
    let pingMs = null;
    let guildCount = null;
    let memberCount = null;

    if (hasBotToken()) {
      if (pingCache.value !== null && pingCache.expires > Date.now()) {
        pingMs = pingCache.value;
      } else {
        const t0 = Date.now();
        try {
          await fetch('https://discord.com/api/v10/gateway', {
            signal: AbortSignal.timeout(5000),
          });
          pingMs = Date.now() - t0;
          pingCache = { value: pingMs, expires: Date.now() + PING_TTL_MS };
        } catch {
          pingMs = null;
        }
      }

      try {
        const botGuilds = await getBotGuilds();
        let guilds = botGuilds;
        if (!isDevAuth()) {
          // Fail closed per guild: a permission-check error hides that guild.
          const manageable = await Promise.all(
            botGuilds.map((g) => userCanManageGuild(req.user.id, g.id).catch(() => false))
          );
          guilds = botGuilds.filter((_, i) => manageable[i]);
        }

        guildCount = guilds.length;
        const withCounts = guilds.filter((g) => typeof g.memberCount === 'number');
        if (withCounts.length > 0) {
          memberCount = withCounts.reduce((sum, g) => sum + g.memberCount, 0);
        }
      } catch {
        // Discord unavailable: report what we can.
      }
    }

    res.json({
      success: true,
      guildCount,
      memberCount,
      pingMs,
      uptimeSec: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

export default router;

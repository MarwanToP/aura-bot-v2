import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, isDevAuth } from '../middleware/auth.js';
import { requireGuildAdmin, userCanManageGuild } from '../middleware/guildAuth.js';
import { hasBotToken, getBotGuilds } from './discord.js';
import sequelize from '../../../../packages/database/index.js';

const router = Router();

const guildConfigSchema = z.object({
  prefix: z.string().min(1).max(5).default('!'),
  language: z.string().min(2).max(5).optional(),
  timezone: z.string().min(1).max(64).optional(),
  neuralModerationEnabled: z.boolean().default(true),
  sensitivityScore: z.number().min(0).max(100).optional(),
  action: z.enum(['warn', 'delete', 'timeout', 'ban']).optional(),
  tempVoiceCategory: z.string().nullable().optional(),
});

// Fetch Guilds Managed by Authenticated User
//
// Live source: guilds the bot is a member of, fetched from Discord with the
// bot token (cached 5 minutes), filtered down to the ones the requesting user
// can actually manage (ADMINISTRATOR / MANAGE_GUILD / guild owner via
// userCanManageGuild) so this endpoint can't be used to enumerate every guild
// the bot is in. Dev-auth sessions see the full list for local convenience.
// Falls back to the placeholder guild when Discord is unreachable or the bot
// token is unset, keeping demo rendering.
router.get('/', requireAuth, async (req, res) => {
  try {
    if (hasBotToken()) {
      try {
        const botGuilds = await getBotGuilds();
        if (botGuilds.length > 0) {
          let guilds = botGuilds;
          if (!isDevAuth()) {
            // Fail closed per guild: a permission-check error hides that guild.
            const manageable = await Promise.all(
              botGuilds.map((g) => userCanManageGuild(req.user.id, g.id).catch(() => false))
            );
            guilds = botGuilds.filter((_, i) => manageable[i]);
          }
          return res.json({ success: true, live: true, guilds });
        }
      } catch (error) {
        console.warn('[guilds] Discord fetch failed, using placeholder:', error.message);
      }
    }

    res.json({
      success: true,
      live: false,
      guilds: [
        {
          id: '123456789012345678',
          name: 'Aura Official Server',
          icon: null,
          memberCount: null,
          onlineCount: null,
        }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user guilds' });
  }
});

// Update Guild Configuration
// Persists the core guild preferences (prefix / language / timezone) into
// GuildSettings; the remaining schema keys stay validated-and-echoed for
// response-shape compatibility with the dashboard form.
router.post('/:guildId/config', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;

  if (!/^\d{17,20}$/.test(guildId)) {
    return res.status(400).json({ error: 'Invalid Guild ID format' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const parsed = guildConfigSchema.safeParse(body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid configuration parameters', details: parsed.error.format() });
  }

  try {
    const { GuildSettings } = sequelize.models;
    if (!GuildSettings) {
      return res.status(503).json({ error: 'Guild settings unavailable' });
    }

    const [settings] = await GuildSettings.findOrCreate({
      where: { guildId },
      defaults: { guildId },
    });

    // Only persist keys the caller actually sent — a partial save (e.g. only
    // timezone) must never reset the stored prefix back to its default.
    const updates = {};
    if (body.prefix !== undefined) updates.prefix = parsed.data.prefix;
    if (body.language !== undefined) updates.language = parsed.data.language;
    if (body.timezone !== undefined) updates.timezone = parsed.data.timezone;
    if (Object.keys(updates).length > 0) {
      await settings.update(updates);
    }

    res.json({
      success: true,
      guildId,
      config: {
        // Only the three persisted keys — the remaining schema keys are
        // validated for backwards compatibility but have no backing column,
        // so echoing them back would claim a save that never happened.
        prefix: settings.prefix,
        language: settings.language,
        timezone: settings.timezone,
      },
    });
  } catch (error) {
    console.warn(`[GuildsAPI] Failed to persist guild config for ${guildId}:`, error.message);
    res.status(500).json({ error: 'Failed to update guild settings' });
  }
});

export default router;

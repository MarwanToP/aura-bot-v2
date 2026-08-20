import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const guildConfigSchema = z.object({
  prefix: z.string().min(1).max(5).default('!'),
  neuralModerationEnabled: z.boolean().default(true),
  sensitivityScore: z.number().min(0).max(100).optional(),
  action: z.enum(['warn', 'delete', 'timeout', 'ban']).optional(),
  tempVoiceCategory: z.string().nullable().optional(),
});

// Fetch Guilds Managed by Authenticated User
router.get('/', requireAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      guilds: [
        {
          id: '123456789012345678',
          name: 'Aura Official Server',
          icon: null,
          owner: true,
          permissions: '8',
        }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user guilds' });
  }
});

// Update Guild Configuration
router.post('/:guildId/config', requireAuth, async (req, res) => {
  const { guildId } = req.params;

  if (!/^\d{17,20}$/.test(guildId)) {
    return res.status(400).json({ error: 'Invalid Guild ID format' });
  }

  const parsed = guildConfigSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid configuration parameters', details: parsed.error.format() });
  }

  try {
    res.json({
      success: true,
      guildId,
      config: parsed.data,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update guild settings' });
  }
});

export default router;

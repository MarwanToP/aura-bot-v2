import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

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
  const { prefix, neuralModerationEnabled, tempVoiceCategory } = req.body;

  try {
    res.json({
      success: true,
      guildId,
      config: {
        prefix: prefix || '!',
        neuralModerationEnabled: Boolean(neuralModerationEnabled),
        tempVoiceCategory: tempVoiceCategory || null,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update guild settings' });
  }
});

export default router;

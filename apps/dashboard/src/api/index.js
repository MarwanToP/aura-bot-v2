// ================================================================
//  @aura/dashboard — REST API Routes & Input Sanitization (Zod)
// ================================================================

import { Router } from 'express';
import { z } from 'zod';
import logger from '@aura/logger';

const router = Router();

// Zod Input Sanitization Schemas
const updateGuildSettingsSchema = z.object({
  prefix: z.string().max(10).optional(),
  language: z.enum(['en', 'ar']).optional(),
  welcomeEnabled: z.boolean().optional(),
  welcomeMessage: z.string().max(1000).optional(),
  antiNukeEnabled: z.boolean().optional(),
});

// GET /api/health
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'dashboard-api', timestamp: new Date().toISOString() });
});

// POST /api/guilds/:guildId/settings — Update guild settings with strict validation
router.post('/guilds/:guildId/settings', async (req, res) => {
  try {
    const validatedBody = updateGuildSettingsSchema.parse(req.body);
    logger.info(`[API] Validated settings update for guild ${req.params.guildId}`);
    res.json({ success: true, data: validatedBody });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Bad Request', details: err.errors });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;

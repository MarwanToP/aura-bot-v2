// ================================================================
//  @aura/dashboard — Unified REST API Routes & Zod Validation Schemas
//  Covers M1-M10 Modules: Security, Moderation, Verification, Tickets,
//  Voice, Social, Economy, Invites, Counters, Governance
// ================================================================

import { Router } from 'express';
import { z } from 'zod';
import logger from '@aura/logger';
import { GuildSettings } from '../../../../packages/database/models.js';

const router = Router();

// ── Zod Input Schemas for Modules ──
const securitySchema = z.object({
  antiNukeEnabled: z.boolean().optional(),
  antiRaidEnabled: z.boolean().optional(),
  antiNukeConfig: z.record(z.any()).optional(),
});

const moderationSchema = z.object({
  autoModEnabled: z.boolean().optional(),
  aiModEnabled: z.boolean().optional(),
  aiModSensitivity: z.enum(['low', 'medium', 'high']).optional(),
  warningConfig: z.record(z.any()).optional(),
});

const verificationSchema = z.object({
  verificationEnabled: z.boolean().optional(),
  verificationRoleId: z.string().nullable().optional(),
  verificationMode: z.enum(['web', 'captcha', 'reaction']).optional(),
  altAgeLimit: z.number().int().min(0).optional(),
});

const ticketsSchema = z.object({
  ticketEnabled: z.boolean().optional(),
  ticketCategoryId: z.string().nullable().optional(),
  ticketSupportRoles: z.array(z.string()).optional(),
});

const voiceSchema = z.object({
  tempVoiceEnabled: z.boolean().optional(),
  tempVoiceCreatorId: z.string().nullable().optional(),
  tempVoiceCategoryId: z.string().nullable().optional(),
  tempVoiceNameTemplate: z.string().optional(),
});

const socialSchema = z.object({
  socialAlertsConfig: z.record(z.any()).optional(),
});

const economySchema = z.object({
  levelingEnabled: z.boolean().optional(),
  xpMultiplier: z.number().min(0.1).max(10.0).optional(),
});

const invitesSchema = z.object({
  inviteTrackEnabled: z.boolean().optional(),
  inviteConfig: z.record(z.any()).optional(),
});

const countersSchema = z.object({
  statsEnabled: z.boolean().optional(),
  customGoalTarget: z.number().int().min(1).optional(),
});

const pollsSchema = z.object({
  suggestionsEnabled: z.boolean().optional(),
  suggestionsChannelId: z.string().nullable().optional(),
});

// GET /api/health
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'dashboard-api', timestamp: new Date().toISOString() });
});

// GET /api/guilds/:guildId/settings — Retrieve full guild settings
router.get('/guilds/:guildId/settings', async (req, res) => {
  try {
    let settings = await GuildSettings.findByPk(req.params.guildId);
    if (!settings) {
      settings = await GuildSettings.create({ guildId: req.params.guildId });
    }
    res.json({ success: true, data: settings });
  } catch (err) {
    logger.error(`[API Error] Failed to fetch settings for ${req.params.guildId}:`, err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/guilds/:guildId/module/:moduleName — Update specific feature module settings
router.post('/guilds/:guildId/module/:moduleName', async (req, res) => {
  const { guildId, moduleName } = req.params;
  try {
    let schema;
    switch (moduleName) {
      case 'security': schema = securitySchema; break;
      case 'moderation': schema = moderationSchema; break;
      case 'verification': schema = verificationSchema; break;
      case 'tickets': schema = ticketsSchema; break;
      case 'voice': schema = voiceSchema; break;
      case 'social': schema = socialSchema; break;
      case 'economy': schema = economySchema; break;
      case 'invites': schema = invitesSchema; break;
      case 'counters': schema = countersSchema; break;
      case 'polls': schema = pollsSchema; break;
      default:
        return res.status(400).json({ error: 'Invalid module name' });
    }

    const validatedData = schema.parse(req.body);
    let settings = await GuildSettings.findByPk(guildId);
    if (!settings) {
      settings = await GuildSettings.create({ guildId, ...validatedData });
    } else {
      await settings.update(validatedData);
    }

    logger.info(`[API] Updated module [${moduleName}] for guild ${guildId}`);
    res.json({ success: true, module: moduleName, data: settings });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Bad Request', details: err.errors });
    }
    logger.error(`[API Error] Failed to update module [${moduleName}] for ${guildId}:`, err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;

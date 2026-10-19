import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireGuildAdmin } from '../middleware/guildAuth.js';
import sequelize from '../../../../packages/database/index.js';

const router = Router();

const DEFAULT_COMMANDS = [
  { name: 'ping', description: 'Check bot latency, uptime, and gateway heartbeat.', category: 'Utility' },
  { name: 'help', description: 'Display dynamic help menu, categories, and command information.', category: 'General' },
  { name: 'ban', description: 'Ban a member permanently or temporarily from the guild.', category: 'Moderation' },
  { name: 'kick', description: 'Kick a member from the guild.', category: 'Moderation' },
  { name: 'timeout', description: 'Mute or timeout a member for a specified duration.', category: 'Moderation' },
  { name: 'clear', description: 'Bulk delete messages from the current channel.', category: 'Moderation' },
  { name: 'warn', description: 'Issue an official moderation warning to a member.', category: 'Moderation' },
  { name: 'case', description: 'View or update details of a moderation case.', category: 'Moderation' },
  { name: 'slowmode', description: 'Set the message slowmode cooldown for a channel.', category: 'Moderation' },
  { name: 'lock', description: 'Lock down a channel to prevent regular members from chatting.', category: 'Moderation' },
  { name: 'unlock', description: 'Unlock a previously locked channel.', category: 'Moderation' },
  { name: 'ai', description: 'Ask the Aura Neural AI assistant questions or generate responses.', category: 'AI' },
  { name: 'chat', description: 'Engage in an AI conversation in the current thread.', category: 'AI' },
  { name: 'translate', description: 'Translate text into any supported language.', category: 'Utility' },
  { name: 'rank', description: 'Display member leveling rank card and XP statistics.', category: 'Leveling' },
  { name: 'leaderboard', description: 'Display top members by XP or economy wealth.', category: 'Leveling' },
  { name: 'balance', description: 'Check your current wallet and bank account balance.', category: 'Economy' },
  { name: 'daily', description: 'Claim daily credit rewards and streak bonuses.', category: 'Economy' },
  { name: 'work', description: 'Complete a job shift to earn economy credits.', category: 'Economy' },
  { name: 'shop', description: 'Browse and purchase server roles or virtual items.', category: 'Economy' },
  { name: 'pay', description: 'Transfer credits to another server member.', category: 'Economy' },
  { name: 'ticket', description: 'Create or configure private support ticket panels.', category: 'Utility' },
  { name: 'verify', description: 'Initiate account verification to unlock guild access.', category: 'Security' },
  { name: 'antinuke', description: 'Configure anti-nuke threshold limits and instant protection.', category: 'Security' },
  { name: 'antiraid', description: 'Configure anti-raid join velocity filters and lockdown.', category: 'Security' },
  { name: 'stats', description: 'Configure live server counter channels (Members, Online, Bots).', category: 'Utility' },
  { name: 'voice', description: 'Configure temporary voice hub rooms and personal controls.', category: 'Utility' },
  { name: 'poll', description: 'Create interactive multi-choice polls with live voting.', category: 'General' },
  { name: 'suggest', description: 'Submit a server feature suggestion for community voting.', category: 'General' },
  { name: 'invites', description: 'View invite tracking analytics and member referrals.', category: 'Management' },
  { name: 'social', description: 'Configure automated YouTube, Twitch, or Reddit alerts.', category: 'Management' },
  { name: 'backup', description: 'Create and restore full server configuration backups.', category: 'Management' },
  { name: 'reactionrole', description: 'Create interactive reaction role menus.', category: 'Management' },
  { name: 'autoresponder', description: 'Configure custom keyword triggers and automatic replies.', category: 'Management' },
  { name: 'games', description: 'Play interactive mini-games (Trivia, Blackjack, CoinFlip).', category: 'Fun' },
];

// 1. Get all available bot commands catalog
router.get('/', (req, res) => {
  res.json(DEFAULT_COMMANDS);
});

// 2. Get command settings for a guild
router.get('/:guildId', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;
  try {
    const CommandSettings = sequelize.models?.CommandSettings;
    if (!CommandSettings) {
      console.warn('[CommandsAPI] CommandSettings model unavailable');
      return res.status(503).json({ error: 'Command settings unavailable' });
    }

    const rows = await CommandSettings.findAll({ where: { guildId } });
    const map = {};
    for (const row of rows) {
      map[row.commandName] = { enabled: row.enabled, allowedRoles: row.allowedRoles || [] };
    }
    // An empty map is a valid answer: the guild simply has no overrides yet.
    return res.json({ success: true, settings: map });
  } catch (error) {
    // A failed read must never look like "no settings stored".
    console.warn(`[CommandsAPI] Failed to load command settings for guild ${guildId}:`, error.message);
    return res.status(500).json({ error: 'Failed to load command settings' });
  }
});

// 3. Update command setting for a guild
router.post('/:guildId/:commandName', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId, commandName } = req.params;
  const { enabled, allowedRoles } = req.body || {};

  // Coerce once and persist those exact values, so the response can echo
  // what was actually written instead of the raw request body.
  const nextEnabled = Boolean(enabled ?? true);
  const nextAllowedRoles = Array.isArray(allowedRoles) ? allowedRoles : [];

  try {
    const CommandSettings = sequelize.models?.CommandSettings;
    if (!CommandSettings) {
      console.warn('[CommandsAPI] CommandSettings model unavailable');
      return res.status(503).json({ error: 'Command settings unavailable' });
    }

    await CommandSettings.upsert({
      guildId,
      commandName,
      enabled: nextEnabled,
      allowedRoles: nextAllowedRoles,
    });

    return res.json({ success: true, guildId, commandName, enabled: nextEnabled, allowedRoles: nextAllowedRoles });
  } catch (error) {
    console.warn(`[CommandsAPI] Failed to update command setting ${commandName} for guild ${guildId}:`, error.message);
    return res.status(500).json({ error: 'Failed to update command setting' });
  }
});

export default router;

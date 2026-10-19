import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { requireGuildAdmin } from '../middleware/guildAuth.js';
import { hasBotToken, discordFetch } from './discord.js';
import sequelize from '../../../../packages/database/index.js';

const router = Router();

// Returned by getGuildSettings when the row exists but the DB read failed.
// Distinct from `null` (settings model not registered) so routes can tell
// "could not read" apart from "nothing stored" and answer 503 instead of a
// fake success.
const SETTINGS_UNAVAILABLE = Symbol('settings-unavailable');

// Helper to safely get or create GuildSettings.
// Never throws: a failed read returns SETTINGS_UNAVAILABLE so write routes can
// refuse (503) instead of reporting a save that never reached Postgres.
async function getGuildSettings(guildId) {
  const { GuildSettings } = sequelize.models;
  if (!GuildSettings) return null;
  try {
    const [settings] = await GuildSettings.findOrCreate({
      where: { guildId },
      defaults: { guildId },
    });
    return settings;
  } catch (err) {
    console.warn(`[ModulesAPI] DB query fallback for guild ${guildId}:`, err.message);
    return SETTINGS_UNAVAILABLE;
  }
}

// True when a settings row is not usable for a write (DB read failed, or the
// model is not registered at all). Callers must answer 503, never `{success:true}`.
function settingsUnavailable(s) {
  return !s || typeof s !== 'object';
}

// Read one settings column. Returns the stored value (or `fallback` when the
// column is NULL) on a successful read, and `null` when the read failed — a
// failed read must never look like "enabled".
function readSetting(s, key, fallback = null) {
  if (!s || typeof s !== 'object') return null;
  const value = s[key];
  return value === undefined || value === null ? fallback : value;
}

// Copy only allowlisted keys from a request body — blocks mass-assignment.
function pickAllowed(body, keys) {
  const updates = {};
  Object.keys(body).forEach((key) => {
    if (keys.includes(key)) updates[key] = body[key];
  });
  return updates;
}

// ── Prototype-pollution guard ───────────────────────────────────
// A JSON request body can carry a "__proto__" key. When a record parser
// copies such a key onto a plain object, the object's prototype is replaced
// ("constructor" / "prototype" shadow the inherited members). The three keys
// are rejected outright — the key schema sees the raw key before the record
// is built — and a record whose prototype is not the standard one is refused
// as well.
const FORBIDDEN_RECORD_KEYS = Object.freeze(['__proto__', 'constructor', 'prototype']);

const safeRecordKey = z.string().refine(
  (key) => !FORBIDDEN_RECORD_KEYS.includes(key),
  { message: 'Object key is not allowed' },
);

const safeRecord = z
  .record(safeRecordKey, z.unknown())
  .superRefine((rec, ctx) => {
    const forbidden = Object.getOwnPropertyNames(rec || {}).find((key) => FORBIDDEN_RECORD_KEYS.includes(key));
    if (forbidden) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Object key "${forbidden}" is not allowed` });
      return;
    }
    const proto = Object.getPrototypeOf(rec || {});
    if (proto !== null && proto !== Object.prototype) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Object prototype is not allowed' });
    }
  });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v) => UUID_RE.test(String(v || ''));

// Discord snowflake id — same rule the bot and guildAuth middleware use.
const SNOWFLAKE_RE = /^\d{17,20}$/;

// Postgres returns BIGINT / aggregate columns as strings; normalise to numbers.
const toInt = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

// Best-effort display-name resolution for leaderboards. One Discord REST call
// (Discord caps a member page at 1000); users outside that page stay null.
// Never throws and never fabricates data: failures log server-side and resolve
// to {} so leaderboard rows fall back to name: null, avatarUrl: null.
//
// discordFetch has no cache of its own (only getBotGuilds does), so a page that
// renders three leaderboards used to fire three identical 1000-member fetches.
// The raw member page is cached per guild for 5 minutes and concurrent callers
// share a single in-flight request.
const MEMBER_CACHE_TTL_MS = 5 * 60 * 1000;
const MEMBER_CACHE_MAX_GUILDS = 50;
const memberPageCache = new Map(); // guildId -> { at, promise }

async function loadGuildMemberPage(guildId) {
  const cached = memberPageCache.get(guildId);
  if (cached && Date.now() - cached.at < MEMBER_CACHE_TTL_MS) {
    return cached.promise;
  }

  // Bound the cache by dropping the oldest guilds (oldest `at`) on insert.
  if (!cached && memberPageCache.size >= MEMBER_CACHE_MAX_GUILDS) {
    let oldestKey = null;
    let oldestAt = Infinity;
    for (const [key, entry] of memberPageCache) {
      if (entry.at < oldestAt) {
        oldestAt = entry.at;
        oldestKey = key;
      }
    }
    if (oldestKey) memberPageCache.delete(oldestKey);
  }

  const promise = discordFetch(`/guilds/${guildId}/members?limit=1000`);
  memberPageCache.set(guildId, { at: Date.now(), promise });
  try {
    return await promise;
  } catch (err) {
    // Never cache a failure — the next request should retry immediately.
    memberPageCache.delete(guildId);
    throw err;
  }
}

async function resolveMemberNames(guildId, userIds) {
  const names = {};
  try {
    const wanted = new Set((userIds || []).map((id) => String(id)));
    if (wanted.size === 0 || !hasBotToken()) return names;

    const members = await loadGuildMemberPage(guildId);
    for (const member of Array.isArray(members) ? members : []) {
      const id = member?.user?.id ? String(member.user.id) : null;
      if (!id || !wanted.has(id)) continue;
      names[id] = {
        name: member.nick || member.user.global_name || member.user.username || null,
        avatarUrl: member.user.avatar
          ? `https://cdn.discordapp.com/avatars/${id}/${member.user.avatar}.png?size=64`
          : null,
      };
    }
  } catch (err) {
    console.warn(`[ModulesAPI] Member name resolution failed for guild ${guildId}:`, err.message);
    return {};
  }
  return names;
}

// ── Master Full Configuration ────────────────────────────────
// Only values backed by a GuildSettings column (or derived from one) are real.
// Everything the dashboard has no storage for is answered as null / [] rather
// than a hardcoded demo number — a failed settings read is likewise null, never
// a fabricated `enabled: true`.
router.get('/:guildId/full-config', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;
  try {
    const s = await getGuildSettings(guildId);
    const enabledModules = Object.entries(MODULE_COLUMNS)
      .filter(([, column]) => Boolean(readSetting(s, column, false)))
      .map(([key]) => key);

    res.json({
      success: true,
      guildId,
      modules: {
        overview: {
          totalMembers: null,
          onlineMembers: null,
          botStatus: null,
          activeVoiceChannels: null,
          modulesEnabled: enabledModules,
        },
        security: {
          neuralModeration: {
            enabled: readSetting(s, 'aiModEnabled'),
            sensitivityScore: null,
            action: null,
          },
          antiRaid: { beastModeThreshold: null, joinLockdown: null },
          verificationGate: {
            enabled: readSetting(s, 'verificationEnabled'),
            mode: s?.verificationMode || 'web',
          },
        },
        tickets: {
          enabled: readSetting(s, 'ticketEnabled'),
          categories: [],
          totalOpen: null,
        },
        tempVoice: {
          enabled: readSetting(s, 'tempVoiceEnabled'),
          hubChannelId: s?.tempVoiceCreatorId || '',
          namingTemplate: s?.tempVoiceNameTemplate || "{user}'s Room",
        },
        staffOffice: {
          enabled: readSetting(s, 'staffSystemEnabled'),
          applicationsOpen: null,
          reviewChannelId: s?.staffLogChannelId || '',
        },
        engagement: {
          socialFeeds: [],
          inviteTracking: readSetting(s, 'inviteTrackEnabled'),
          pollsActive: null,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve guild full configuration' });
  }
});

// ── 1. Live Counters & Stats ──────────────────────────────────
router.get('/:guildId/counters', requireAuth, requireGuildAdmin, async (req, res) => {
  const s = await getGuildSettings(req.params.guildId);
  res.json({
    statsEnabled: Boolean(s?.statsEnabled),
    statsMemberChannelId: s?.statsMemberChannelId || '',
    statsOnlineChannelId: s?.statsOnlineChannelId || '',
    statsBotChannelId: s?.statsBotChannelId || '',
    statsCustomChannelId: s?.statsCustomChannelId || '',
    statsMemberFormat: s?.statsMemberFormat || '👥 Members: {count}',
    statsOnlineFormat: s?.statsOnlineFormat || '🟢 Online: {count}',
    statsBotFormat: s?.statsBotFormat || '🤖 Bots: {count}',
    statsCustomFormat: s?.statsCustomFormat || '🎯 Goal: {count}/{target}',
    customGoalTarget: s?.customGoalTarget || 1000,
  });
});

// Channel/role id columns are plain STRINGs the dashboard clears by sending ''
// or null — accept all three so a cleared field stays clearable.
const discordIdField = z.union([z.string().regex(SNOWFLAKE_RE), z.literal(''), z.null()]);

const countersSchema = z.object({
  statsEnabled: z.boolean().optional(),
  statsMemberChannelId: discordIdField.optional(),
  statsOnlineChannelId: discordIdField.optional(),
  statsBotChannelId: discordIdField.optional(),
  statsCustomChannelId: discordIdField.optional(),
  statsMemberFormat: z.string().max(200).optional(),
  statsOnlineFormat: z.string().max(200).optional(),
  statsBotFormat: z.string().max(200).optional(),
  statsCustomFormat: z.string().max(200).optional(),
  customGoalTarget: z.number().int().min(0).max(1000000000).optional(),
});

router.post('/:guildId/counters', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;

  // pickAllowed stays as a second mass-assignment guard on top of the schema.
  const allowedUpdates = ['statsEnabled', 'statsMemberChannelId', 'statsOnlineChannelId', 'statsBotChannelId', 'statsCustomChannelId', 'statsMemberFormat', 'statsOnlineFormat', 'statsBotFormat', 'statsCustomFormat', 'customGoalTarget'];
  const parsed = countersSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid counters configuration' });
  }

  const s = await getGuildSettings(guildId);
  if (settingsUnavailable(s)) {
    return res.status(503).json({ error: 'Storage unavailable' });
  }

  try {
    await s.update(pickAllowed(parsed.data, allowedUpdates));
  } catch (err) {
    console.warn(`[ModulesAPI] Save counters failed for guild ${guildId}:`, err.message);
    return res.status(500).json({ error: 'Internal error' });
  }

  res.json({ success: true });
});

// ── 2. Gamification & Economy ─────────────────────────────────
router.get('/:guildId/economy', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;
  try {
    const s = await getGuildSettings(guildId);

    const { Economy } = sequelize.models;
    let stats = { accounts: 0, totalBalance: 0, totalBank: 0, totalEarned: 0 };
    if (Economy) {
      const [row] = await Economy.findAll({
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'accounts'],
          [sequelize.fn('SUM', sequelize.col('balance')), 'totalBalance'],
          [sequelize.fn('SUM', sequelize.col('bank')), 'totalBank'],
          [sequelize.fn('SUM', sequelize.col('totalEarned')), 'totalEarned'],
        ],
        where: { guildId },
        raw: true,
      });
      stats = {
        accounts: toInt(row?.accounts),
        totalBalance: toInt(row?.totalBalance),
        totalBank: toInt(row?.totalBank),
        totalEarned: toInt(row?.totalEarned),
      };
    }

    res.json({
      // readSetting: real stored value (model defaults apply) on a successful
      // read, null when the settings read failed — never an invented `true`.
      levelingEnabled: readSetting(s, 'levelingEnabled', true),
      xpMultiplier: readSetting(s, 'xpMultiplier', 1.0),
      xpDecayEnabled: readSetting(s, 'xpDecayEnabled', true),
      xpDecayGraceDays: readSetting(s, 'xpDecayGraceDays', 7),
      xpDecayHalfLifeDays: readSetting(s, 'xpDecayHalfLifeDays', 14),
      levelUpChannelId: s?.levelUpChannelId || '',
      levelUpMessage: s?.levelUpMessage || 'Congratulations {user}, you leveled up to level {level}!',
      stats,
    });
  } catch (err) {
    console.warn(`[ModulesAPI] Load economy data failed for guild ${guildId}:`, err.message);
    res.status(500).json({ error: 'Failed to load economy data' });
  }
});

const economySchema = z.object({
  levelingEnabled: z.boolean().optional(),
  xpMultiplier: z.number().min(0).max(1000).optional(),
  xpDecayEnabled: z.boolean().optional(),
  xpDecayGraceDays: z.number().int().min(0).max(3650).optional(),
  xpDecayHalfLifeDays: z.number().int().min(1).max(3650).optional(),
  levelUpChannelId: discordIdField.optional(),
  levelUpMessage: z.string().max(2000).optional(),
});

router.post('/:guildId/economy', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;

  // Strict validation (pickAllowed kept as a second mass-assignment guard).
  const allowedUpdates = ['levelingEnabled', 'xpMultiplier', 'xpDecayEnabled', 'xpDecayGraceDays', 'xpDecayHalfLifeDays', 'levelUpChannelId', 'levelUpMessage'];
  const parsed = economySchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid economy configuration' });
  }

  const s = await getGuildSettings(guildId);
  if (settingsUnavailable(s)) {
    return res.status(503).json({ error: 'Storage unavailable' });
  }

  try {
    await s.update(pickAllowed(parsed.data, allowedUpdates));
  } catch (err) {
    console.warn(`[ModulesAPI] Save economy settings failed for guild ${guildId}:`, err.message);
    return res.status(500).json({ error: 'Internal error' });
  }

  res.json({ success: true, message: 'Economy settings updated' });
});

router.get('/:guildId/economy/leaderboard', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;
  try {
    const { Economy } = sequelize.models;
    const rows = Economy
      ? await Economy.findAll({
        where: { guildId },
        attributes: ['userId', 'balance', 'bank', 'totalEarned', 'reputation', 'dailyStreak'],
        order: [[sequelize.literal('("balance" + "bank")'), 'DESC']],
        limit: 25,
        raw: true,
      })
      : [];

    const names = await resolveMemberNames(guildId, rows.map((row) => row.userId));
    res.json({
      leaderboard: rows.map((row) => ({
        userId: row.userId,
        name: names[row.userId]?.name ?? null,
        avatarUrl: names[row.userId]?.avatarUrl ?? null,
        balance: toInt(row.balance),
        bank: toInt(row.bank),
        totalEarned: toInt(row.totalEarned),
        reputation: toInt(row.reputation),
        dailyStreak: toInt(row.dailyStreak),
      })),
    });
  } catch (err) {
    console.warn(`[ModulesAPI] Load economy leaderboard failed for guild ${guildId}:`, err.message);
    res.status(500).json({ error: 'Failed to load economy leaderboard' });
  }
});

// Shared projection so GET/POST /economy/shop return identical field sets.
function shopItemShape(item) {
  return {
    id: item.id,
    name: item.name,
    price: item.price,
    stock: item.stock,
    roleId: item.roleId,
    enabled: Boolean(item.enabled),
  };
}

const shopItemSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(1).max(100),
  price: z.number().int().min(0),
  // stock: -1 means "unlimited" (the ShopItem model default) — validating
  // min(0) made every existing unlimited item fail validation on save.
  stock: z.number().int().min(-1).nullable().optional(),
  roleId: z.string().regex(SNOWFLAKE_RE).nullable().optional(),
  enabled: z.boolean().optional(),
});

router.get('/:guildId/economy/shop', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;
  try {
    const { ShopItem } = sequelize.models;
    const items = ShopItem
      ? await ShopItem.findAll({ where: { guildId }, order: [['id', 'ASC']] })
      : [];
    res.json({ items: items.map(shopItemShape) });
  } catch (err) {
    console.warn(`[ModulesAPI] Load shop items failed for guild ${guildId}:`, err.message);
    res.status(500).json({ error: 'Failed to load shop items' });
  }
});

router.post('/:guildId/economy/shop', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;

  const parsed = shopItemSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid shop item', details: parsed.error.format() });
  }

  try {
    const { ShopItem } = sequelize.models;
    if (!ShopItem) return res.status(503).json({ error: 'Economy module unavailable' });

    const { id, ...data } = parsed.data;
    if (id !== undefined) {
      // An id that isn't in this guild means the row was deleted (or never
      // belonged here) — 404 instead of silently creating a duplicate.
      const existing = await ShopItem.findOne({ where: { id, guildId } });
      if (!existing) return res.status(404).json({ error: 'Shop item not found' });
      await existing.update(data);
      return res.json({ item: shopItemShape(existing) });
    }

    const item = await ShopItem.create({ ...data, guildId });
    res.json({ item: shopItemShape(item) });
  } catch (err) {
    console.warn(`[ModulesAPI] Save shop item failed for guild ${guildId}:`, err.message);
    res.status(500).json({ error: 'Failed to save shop item' });
  }
});

router.get('/:guildId/leveling', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;
  try {
    const { UserProfile, LevelReward } = sequelize.models;

    const profiles = UserProfile
      ? await UserProfile.findAll({
        where: { guildId },
        attributes: ['userId', 'xp', 'level', 'totalMessages', 'voiceMinutes'],
        order: [['xp', 'DESC']],
        limit: 25,
        raw: true,
      })
      : [];
    const rewards = LevelReward
      ? await LevelReward.findAll({
        where: { guildId },
        attributes: ['level', 'roleId', 'removeOnNext'],
        order: [['level', 'ASC']],
        raw: true,
      })
      : [];

    const names = await resolveMemberNames(guildId, profiles.map((p) => p.userId));
    res.json({
      leaderboard: profiles.map((p) => ({
        userId: p.userId,
        name: names[p.userId]?.name ?? null,
        avatarUrl: names[p.userId]?.avatarUrl ?? null,
        xp: toInt(p.xp),
        level: toInt(p.level),
        messages: toInt(p.totalMessages),
        voiceMinutes: toInt(p.voiceMinutes),
      })),
      rewards: rewards.map((r) => ({
        level: r.level,
        roleId: r.roleId,
        removeOnNext: Boolean(r.removeOnNext),
      })),
    });
  } catch (err) {
    console.warn(`[ModulesAPI] Load leveling data failed for guild ${guildId}:`, err.message);
    res.status(500).json({ error: 'Failed to load leveling data' });
  }
});

const levelRewardSchema = z.object({
  level: z.number().int().min(1).max(1000),
  roleId: z.string().regex(SNOWFLAKE_RE),
  removeOnNext: z.boolean().optional(),
});

router.post('/:guildId/leveling/rewards', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;

  const parsed = levelRewardSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid level reward', details: parsed.error.format() });
  }

  try {
    const { LevelReward } = sequelize.models;
    if (!LevelReward) return res.status(503).json({ error: 'Leveling module unavailable' });

    const { level, roleId, removeOnNext } = parsed.data;
    // findOne + create/update: level_rewards has no unique index on
    // (guildId, level), so a native ON CONFLICT upsert would be rejected by
    // Postgres. Semantics are still upsert-on-(guildId, level).
    let reward = await LevelReward.findOne({ where: { guildId, level } });
    if (reward) {
      await reward.update({ roleId, removeOnNext: removeOnNext ?? false });
    } else {
      reward = await LevelReward.create({ guildId, level, roleId, removeOnNext: removeOnNext ?? false });
    }

    res.json({
      reward: { level: reward.level, roleId: reward.roleId, removeOnNext: Boolean(reward.removeOnNext) },
    });
  } catch (err) {
    console.warn(`[ModulesAPI] Save level reward failed for guild ${guildId}:`, err.message);
    res.status(500).json({ error: 'Failed to save level reward' });
  }
});

router.delete('/:guildId/leveling/rewards/:level', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;
  const level = Number(req.params.level);
  if (!Number.isInteger(level) || level < 1 || level > 1000) {
    return res.status(400).json({ error: 'Invalid level' });
  }

  try {
    const { LevelReward } = sequelize.models;
    if (LevelReward) {
      await LevelReward.destroy({ where: { guildId, level } });
    }
    res.json({ ok: true });
  } catch (err) {
    console.warn(`[ModulesAPI] Delete level reward failed for guild ${guildId}:`, err.message);
    res.status(500).json({ error: 'Failed to delete level reward' });
  }
});

// ── 3. Governance: Polls & Suggestions ────────────────────────
// There is no Poll model in packages/database/models.js and the bot keeps polls
// outside the dashboard's reach, so this endpoint reports no data instead of
// returning demo polls.
router.get('/:guildId/polls', requireAuth, requireGuildAdmin, async (req, res) => {
  res.json({ polls: [] });
});

router.post('/:guildId/polls', requireAuth, requireGuildAdmin, async (req, res) => {
  res.status(501).json({ error: 'Poll creation is not supported by the dashboard API' });
});

router.get('/:guildId/suggestions', requireAuth, requireGuildAdmin, async (req, res) => {
  const s = await getGuildSettings(req.params.guildId);
  res.json({
    enabled: readSetting(s, 'suggestionsEnabled', false),
    channelId: s?.suggestionsChannelId || '',
    // Suggestion rows are written by the bot; this API never persisted any.
    suggestions: [],
  });
});

const suggestionsSchema = z.object({
  enabled: z.boolean().optional(),
  channelId: discordIdField.optional(),
});

router.post('/:guildId/suggestions', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;

  const parsed = suggestionsSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid suggestions configuration' });
  }

  const s = await getGuildSettings(guildId);
  if (settingsUnavailable(s)) {
    return res.status(503).json({ error: 'Storage unavailable' });
  }

  const updates = {};
  if (parsed.data.enabled !== undefined) updates.suggestionsEnabled = parsed.data.enabled;
  if (parsed.data.channelId !== undefined) updates.suggestionsChannelId = parsed.data.channelId;

  try {
    await s.update(updates);
  } catch (err) {
    console.warn(`[ModulesAPI] Save suggestions settings failed for guild ${guildId}:`, err.message);
    return res.status(500).json({ error: 'Internal error' });
  }

  res.json({ success: true });
});

// ── 4. Growth & Invites ───────────────────────────────────────
router.get('/:guildId/invites', requireAuth, requireGuildAdmin, async (req, res) => {
  const s = await getGuildSettings(req.params.guildId);
  res.json({
    // null (not true) when the settings read failed.
    enabled: readSetting(s, 'inviteTrackEnabled', false),
    config: s?.inviteConfig || { fakeShieldEnabled: true, minAccountAgeDays: 7, rankRewards: [] },
  });
});

// inviteConfig is unbounded JSONB in the model; cap the array sizes so a hostile
// payload can't be persisted verbatim.
const invitesSchema = z.object({
  enabled: z.boolean().optional(),
  config: z.object({
    fakeShieldEnabled: z.boolean().optional(),
    minAccountAgeDays: z.number().int().min(0).max(3650).optional(),
    rankRewards: z.array(safeRecord).max(50).optional(),
  }).optional(),
});

router.post('/:guildId/invites', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;

  const parsed = invitesSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid invites configuration' });
  }

  const s = await getGuildSettings(guildId);
  if (settingsUnavailable(s)) {
    return res.status(503).json({ error: 'Storage unavailable' });
  }

  const updates = {};
  // Only an explicitly sent `enabled` is written — `req.body.enabled ?? true`
  // used to switch tracking on for callers that sent a config only.
  if (parsed.data.enabled !== undefined) updates.inviteTrackEnabled = parsed.data.enabled;
  if (parsed.data.config !== undefined) updates.inviteConfig = parsed.data.config;

  try {
    await s.update(updates);
  } catch (err) {
    console.warn(`[ModulesAPI] Save invites settings failed for guild ${guildId}:`, err.message);
    return res.status(500).json({ error: 'Internal error' });
  }

  res.json({ success: true });
});

router.get('/:guildId/invites/leaderboard', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;
  try {
    const { InviteTrack } = sequelize.models;
    const rows = InviteTrack
      ? await InviteTrack.findAll({
        attributes: [
          'inviterId',
          [sequelize.fn('COUNT', sequelize.col('id')), 'invites'],
          [sequelize.fn('COUNT', sequelize.literal('CASE WHEN "fake" THEN 1 END')), 'fake'],
          [sequelize.fn('COUNT', sequelize.literal('CASE WHEN "left" THEN 1 END')), 'left'],
        ],
        where: { guildId },
        group: ['inviterId'],
        order: [[sequelize.literal('COUNT(*)'), 'DESC']],
        limit: 25,
        raw: true,
      })
      : [];

    const names = await resolveMemberNames(guildId, rows.map((row) => row.inviterId));
    res.json({
      leaderboard: rows.map((row) => {
        const invites = toInt(row.invites);
        const fake = toInt(row.fake);
        const left = toInt(row.left);
        return {
          userId: row.inviterId,
          name: names[row.inviterId]?.name ?? null,
          avatarUrl: names[row.inviterId]?.avatarUrl ?? null,
          invites,
          fake,
          left,
          valid: invites - fake - left,
        };
      }),
    });
  } catch (err) {
    console.warn(`[ModulesAPI] Load invite leaderboard failed for guild ${guildId}:`, err.message);
    res.status(500).json({ error: 'Failed to load invite leaderboard' });
  }
});

// ── 5. Moderation & AutoMod ───────────────────────────────────
router.get('/:guildId/moderation', requireAuth, requireGuildAdmin, async (req, res) => {
  const s = await getGuildSettings(req.params.guildId);
  res.json({
    modLogChannelId: s?.modLogChannelId || '',
    auditLogChannelId: s?.auditLogChannelId || '',
    muteRoleId: s?.muteRoleId || '',
    warningConfig: s?.warningConfig || { maxWarnings: 3, defaultAction: 'timeout', durationMinutes: 60 },
  });
});

// warningConfig is a bot-owned JSONB column: bound the array sizes rather than
// pinning an inner shape the dashboard does not own.
const moderationSchema = z.object({
  modLogChannelId: discordIdField.optional(),
  auditLogChannelId: discordIdField.optional(),
  muteRoleId: discordIdField.optional(),
  warningConfig: z.object({
    maxWarnings: z.number().int().min(0).max(100).optional(),
    defaultAction: z.enum(['warn', 'kick', 'ban', 'timeout', 'delete']).optional(),
    durationMinutes: z.number().int().min(0).max(40320).optional(),
  }).optional(),
});

router.post('/:guildId/moderation', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;

  const allowedUpdates = ['modLogChannelId', 'auditLogChannelId', 'muteRoleId', 'warningConfig'];
  const parsed = moderationSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid moderation configuration' });
  }

  const s = await getGuildSettings(guildId);
  if (settingsUnavailable(s)) {
    return res.status(503).json({ error: 'Storage unavailable' });
  }

  try {
    await s.update(pickAllowed(parsed.data, allowedUpdates));
  } catch (err) {
    console.warn(`[ModulesAPI] Save moderation settings failed for guild ${guildId}:`, err.message);
    return res.status(500).json({ error: 'Internal error' });
  }

  res.json({ success: true });
});

router.get('/:guildId/automod', requireAuth, requireGuildAdmin, async (req, res) => {
  const s = await getGuildSettings(req.params.guildId);
  // A failed settings read must not be reported as "everything disabled" —
  // that is indistinguishable from a real "off". Answer 503 instead.
  if (settingsUnavailable(s)) {
    return res.status(503).json({ error: 'Settings unavailable' });
  }
  res.json({
    autoModEnabled: s?.autoModEnabled ?? false,
    aiModEnabled: s?.aiModEnabled ?? false,
    aiModSensitivity: s?.aiModSensitivity || 'medium',
    autoModConfig: s?.autoModConfig || { bannedWords: [], inviteLinks: false, spamThreshold: 5, action: 'timeout', durationMinutes: 10, exemptRoles: [], exemptChannels: [] },
  });
});

const autoModSchema = z.object({
  autoModEnabled: z.boolean().optional(),
  aiModEnabled: z.boolean().optional(),
  aiModSensitivity: z.enum(['low', 'medium', 'high']).optional(),
  autoModConfig: z.object({
    bannedWords: z.array(z.string().max(100)).max(1000).optional(),
    inviteLinks: z.boolean().optional(),
    spamThreshold: z.number().int().min(1).max(100).optional(),
    action: z.enum(['warn', 'delete', 'timeout', 'ban', 'kick']).optional(),
    durationMinutes: z.number().int().min(0).max(40320).optional(),
    exemptRoles: z.array(z.string().regex(SNOWFLAKE_RE)).max(100).optional(),
    exemptChannels: z.array(z.string().regex(SNOWFLAKE_RE)).max(100).optional(),
  }).optional(),
});

router.post('/:guildId/automod', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;

  const allowedUpdates = ['autoModEnabled', 'aiModEnabled', 'aiModSensitivity', 'autoModConfig'];
  const parsed = autoModSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid automod configuration' });
  }

  const s = await getGuildSettings(guildId);
  if (settingsUnavailable(s)) {
    return res.status(503).json({ error: 'Storage unavailable' });
  }

  try {
    await s.update(pickAllowed(parsed.data, allowedUpdates));
  } catch (err) {
    console.warn(`[ModulesAPI] Save automod settings failed for guild ${guildId}:`, err.message);
    return res.status(500).json({ error: 'Internal error' });
  }

  // The bot caches the AI auto-mod flag under "aura:guild:<guildId>:config"
  // for 300 s — drop it so the dashboard toggle reaches the running bot
  // immediately instead of after the TTL.
  await invalidateBotCache(guildId, [BOT_CACHE_KEYS.guildConfig(guildId)], 'AutoMod');

  res.json({ success: true });
});

router.get('/:guildId/cases', requireAuth, requireGuildAdmin, async (req, res) => {
  try {
    const { ModerationCase } = sequelize.models;
    if (!ModerationCase) return res.json([]);

    const cases = await ModerationCase.findAll({
      where: { guildId: req.params.guildId },
      order: [['caseId', 'DESC']],
      limit: 50,
    });
    res.json(cases);
  } catch (err) {
    console.warn(`[ModulesAPI] Load moderation cases failed for guild ${req.params.guildId}:`, err.message);
    res.status(500).json({ error: 'Failed to load moderation cases' });
  }
});

// ── 6. Security, Anti-Nuke, Anti-Raid ─────────────────────────
router.get('/:guildId/security', requireAuth, requireGuildAdmin, async (req, res) => {
  const s = await getGuildSettings(req.params.guildId);
  // A failed settings read must not be reported as "everything disabled" —
  // that is indistinguishable from a real "off". Answer 503 instead.
  if (settingsUnavailable(s)) {
    return res.status(503).json({ error: 'Settings unavailable' });
  }
  res.json({
    antiNukeEnabled: s?.antiNukeEnabled ?? false,
    antiNukeConfig: s?.antiNukeConfig || { maxChannelDeletions: 2, maxRoleDeletions: 2, maxBans: 3, maxKicks: 3, action: 'quarantine' },
    antiRaidEnabled: s?.antiRaidEnabled ?? false,
    verificationEnabled: s?.verificationEnabled ?? false,
    verificationMode: s?.verificationMode || 'web',
    verificationRoleId: s?.verificationRoleId || '',
    unverifiedRoleId: s?.unverifiedRoleId || '',
  });
});

const securitySchema = z.object({
  antiNukeEnabled: z.boolean().optional(),
  antiNukeConfig: z.object({
    maxChannelDeletions: z.number().int().min(0).max(100).optional(),
    maxRoleDeletions: z.number().int().min(0).max(100).optional(),
    maxBans: z.number().int().min(0).max(100).optional(),
    maxKicks: z.number().int().min(0).max(100).optional(),
    action: z.enum(['quarantine', 'ban', 'kick', 'lockdown']).optional(),
  }).optional(),
  antiRaidEnabled: z.boolean().optional(),
  verificationEnabled: z.boolean().optional(),
  verificationMode: z.enum(['web', 'button', 'captcha']).optional(),
  verificationRoleId: discordIdField.optional(),
  unverifiedRoleId: discordIdField.optional(),
});

router.post('/:guildId/security', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;

  const allowedUpdates = ['antiNukeEnabled', 'antiNukeConfig', 'antiRaidEnabled', 'verificationEnabled', 'verificationMode', 'verificationRoleId', 'unverifiedRoleId'];
  const parsed = securitySchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid security configuration' });
  }

  const s = await getGuildSettings(guildId);
  if (settingsUnavailable(s)) {
    return res.status(503).json({ error: 'Storage unavailable' });
  }

  try {
    await s.update(pickAllowed(parsed.data, allowedUpdates));
  } catch (err) {
    console.warn(`[ModulesAPI] Save security config failed for guild ${guildId}:`, err.message);
    return res.status(500).json({ error: 'Internal error' });
  }

  res.json({ success: true, message: 'Security config updated' });
});

// Quarantine state lives in Redis under the bot's keys; the dashboard has no
// reader for it. Answer honestly instead of implying an empty, working list.
router.get('/:guildId/quarantine', requireAuth, requireGuildAdmin, async (req, res) => {
  res.json([]);
});

router.post('/:guildId/quarantine/:userId/unquarantine', requireAuth, requireGuildAdmin, async (req, res) => {
  res.status(501).json({ error: 'Unquarantine is not implemented by the dashboard API' });
});

// ── 7. Social Alerts ──────────────────────────────────────────
// Platforms supported by the bot's social-alerts system (see
// packages/systems/socialAlerts/socialAlerts.js).
const SOCIAL_ALERT_PLATFORMS = ['twitch', 'youtube', 'reddit', 'rss', 'twitter', 'instagram', 'tiktok', 'bluesky', 'kick', 'podcast'];

// Validate the alert list posted by the dashboard. Returns { alerts } on
// success or { error } for a 400 response. Only known fields are persisted
// (mass-assignment protection); the bot's runtime fields (id / message /
// lastPostId) are preserved so toggles don't wipe them.
function validateSocialAlerts(alerts) {
  if (!Array.isArray(alerts)) return { error: 'alerts must be an array' };
  if (alerts.length > 50) return { error: 'alerts must contain at most 50 items' };

  const validated = [];
  for (let i = 0; i < alerts.length; i += 1) {
    const alert = alerts[i];
    if (!alert || typeof alert !== 'object' || Array.isArray(alert)) {
      return { error: `alerts[${i}] must be an object` };
    }

    const { platform, identifier, channelId, pingRoleId, enabled } = alert;
    if (!SOCIAL_ALERT_PLATFORMS.includes(platform)) {
      return { error: `alerts[${i}].platform must be one of: ${SOCIAL_ALERT_PLATFORMS.join(', ')}` };
    }
    if (typeof identifier !== 'string' || identifier.length === 0 || identifier.length > 100) {
      return { error: `alerts[${i}].identifier must be a non-empty string of at most 100 characters` };
    }
    if (typeof channelId !== 'string' || channelId.length === 0) {
      return { error: `alerts[${i}].channelId must be a non-empty string` };
    }
    if (pingRoleId != null && typeof pingRoleId !== 'string') {
      return { error: `alerts[${i}].pingRoleId must be a string` };
    }
    if (enabled !== undefined && typeof enabled !== 'boolean') {
      return { error: `alerts[${i}].enabled must be a boolean` };
    }

    const entry = { platform, identifier, channelId, enabled: enabled !== false };
    if (pingRoleId) entry.pingRoleId = pingRoleId;
    if (typeof alert.id === 'number' || typeof alert.id === 'string') entry.id = alert.id;
    if (typeof alert.message === 'string') entry.message = alert.message;
    if (typeof alert.lastPostId === 'string' || typeof alert.lastPostId === 'number' || alert.lastPostId === null) {
      entry.lastPostId = alert.lastPostId;
    }
    validated.push(entry);
  }

  return { alerts: validated };
}

// Cache keys the BOT reads. The bot caches them through its own client, which
// applies the "aura2:" key prefix — the shared @aura/redis client used below
// carries the same prefix, so the raw key names below address exactly the
// entries the bot reads:
//   • autoresponder:<guildId>      → apps/bot/src/events/messageCreate.js
//   • aura:guild:<guildId>:config → apps/bot/src/events/messageCreate.js
//                                    (holds the AI auto-mod flag)
//   • social:alerts:<guildId>     → packages/systems/socialAlerts/socialAlerts.js
const BOT_CACHE_KEYS = {
  autoResponder: (guildId) => `autoresponder:${guildId}`,
  guildConfig:   (guildId) => `aura:guild:${guildId}:config`,
  socialAlerts:  (guildId) => `social:alerts:${guildId}`,
};

// Best-effort cache bust after a successful save: the bot reads these keys
// from Redis first (300 s … 30-day TTL) and only falls back to the DB when
// the key is missing, so the stale entry must be removed for dashboard
// changes to reach the running bot. Uses @aura/redis (same key prefix as the
// bot's client); imported lazily because the package builds its ioredis
// clients at import time. Never fails the request.
let redisModulePromise = null;
async function invalidateBotCache(guildId, keys, label = 'Bot') {
  if (!Array.isArray(keys) || keys.length === 0) return;
  try {
    redisModulePromise ??= import('../../../../packages/redis/index.js');
    const { redis } = await redisModulePromise;

    const del = redis.del(...keys);
    del.catch(() => {}); // settle the losing side of the timeout race below

    let timer;
    try {
      await Promise.race([
        del,
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error('timed out after 3s')), 3000);
          timer.unref?.();
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    redisModulePromise = null; // allow a later retry (e.g. module resolution error)
    console.warn(`[ModulesAPI] ${label} cache invalidation skipped for guild ${guildId}:`, err.message);
  }
}

async function invalidateSocialAlertsCache(guildId) {
  await invalidateBotCache(guildId, [BOT_CACHE_KEYS.socialAlerts(guildId)], 'Social alerts');
}

// Auto-responder CRUD changes what the bot answers with, and an AI-backed
// responder also depends on the guild's AI moderation configuration, so both
// bot-side cache entries are dropped after a write.
async function invalidateAutoResponderCache(guildId) {
  await invalidateBotCache(
    guildId,
    [BOT_CACHE_KEYS.autoResponder(guildId), BOT_CACHE_KEYS.guildConfig(guildId)],
    'Auto-responder',
  );
}

router.get('/:guildId/social-alerts', requireAuth, requireGuildAdmin, async (req, res) => {
  const s = await getGuildSettings(req.params.guildId);
  res.json(s?.socialAlertsConfig || []);
});

router.post('/:guildId/social-alerts', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;

  const { alerts, error } = validateSocialAlerts(req.body?.alerts);
  if (error) return res.status(400).json({ error });

  const s = await getGuildSettings(guildId);
  if (settingsUnavailable(s)) {
    return res.status(503).json({ error: 'Storage unavailable' });
  }

  const existing =
    s.socialAlertsConfig && typeof s.socialAlertsConfig === 'object' && !Array.isArray(s.socialAlertsConfig)
      ? s.socialAlertsConfig
      : {};
  const config = { ...existing, alerts };

  try {
    s.socialAlertsConfig = config;
    await s.save();
  } catch (err) {
    console.warn(`[ModulesAPI] Save social alerts failed for guild ${guildId}:`, err.message);
    return res.status(500).json({ error: 'Internal error' });
  }
  await invalidateSocialAlertsCache(guildId);

  res.json({ success: true, data: config });
});

// ── 8. Ticketing & Panels ─────────────────────────────────────
router.get('/:guildId/ticket-panels', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;
  try {
    const { TicketPanel } = sequelize.models;
    const panels = TicketPanel
      ? await TicketPanel.findAll({
        where: { guildId },
        attributes: ['panelId', 'channelId', 'messageId', 'categories', 'active', 'createdAt'],
        order: [['createdAt', 'DESC']],
        raw: true,
      })
      : [];
    res.json({ panels: panels.map(ticketPanelShape) });
  } catch (err) {
    console.warn(`[ModulesAPI] Load ticket panels failed for guild ${guildId}:`, err.message);
    res.status(500).json({ error: 'Failed to load ticket panels' });
  }
});

// Shared projection so GET/POST /ticket-panels return identical field sets.
function ticketPanelShape(panel) {
  return {
    panelId: panel.panelId,
    channelId: panel.channelId ?? null,
    messageId: panel.messageId ?? null,
    categories: panel.categories ?? [],
    active: Boolean(panel.active),
    createdAt: panel.createdAt ?? null,
  };
}

// Persist the same columns GET /ticket-panels reads.
const ticketPanelSchema = z.object({
  panelId: z.string().min(1).max(64),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  image: z.string().max(500).nullable().optional(),
  thumbnail: z.string().max(500).nullable().optional(),
  channelId: discordIdField.optional(),
  messageId: discordIdField.optional(),
  categories: z.array(safeRecord).max(50).optional(),
  active: z.boolean().optional(),
});

router.post('/:guildId/ticket-panels', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;

  const parsed = ticketPanelSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid ticket panel' });
  }

  try {
    const { TicketPanel } = sequelize.models;
    if (!TicketPanel) return res.status(503).json({ error: 'Ticket panels module unavailable' });

    const { panelId, ...rest } = parsed.data;
    const data = pickAllowed(rest, ['title', 'description', 'image', 'thumbnail', 'channelId', 'messageId', 'categories', 'active']);

    // ticket_panels has no unique index on (guildId, panelId), so this is an
    // explicit findOne + create/update rather than a native ON CONFLICT upsert.
    let panel = await TicketPanel.findOne({ where: { guildId, panelId } });
    if (panel) {
      await panel.update(data);
    } else {
      panel = await TicketPanel.create({ ...data, guildId, panelId });
    }

    res.json({ success: true, panel: ticketPanelShape(panel) });
  } catch (err) {
    console.warn(`[ModulesAPI] Save ticket panel failed for guild ${guildId}:`, err.message);
    res.status(500).json({ error: 'Failed to save ticket panel' });
  }
});

router.get('/:guildId/tickets', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;
  try {
    const { Ticket } = sequelize.models;
    if (!Ticket) {
      return res.json({
        tickets: [],
        stats: { total: 0, open: 0, closed: 0, avgFirstResponseMins: null, avgCsat: null },
      });
    }

    const [tickets, total, open, closed, aggregate] = await Promise.all([
      Ticket.findAll({
        where: { guildId },
        // subject / userId / transcriptUrl back the ticket list UI (who opened
        // it, what about it); userName is added below via resolveMemberNames.
        attributes: ['ticketId', 'category', 'subject', 'userId', 'priority', 'status', 'claimedBy', 'closedBy', 'closedAt', 'firstResponseAt', 'satisfaction', 'tier', 'transcriptUrl', 'createdAt'],
        order: [['createdAt', 'DESC'], ['id', 'DESC']],
        limit: 100,
        raw: true,
      }),
      Ticket.count({ where: { guildId } }),
      Ticket.count({ where: { guildId, status: 'open' } }),
      Ticket.count({ where: { guildId, status: 'closed' } }),
      Ticket.findAll({
        attributes: [
          [sequelize.fn('AVG', sequelize.literal('EXTRACT(EPOCH FROM ("firstResponseAt" - "createdAt")) / 60.0')), 'avgFirstResponseMins'],
          [sequelize.fn('AVG', sequelize.col('satisfaction')), 'avgCsat'],
        ],
        where: { guildId },
        raw: true,
      }),
    ]);

    const agg = aggregate?.[0] || {};
    // Display names come from the live member page (cached 5 min); unresolved
    // ids stay null — never a fabricated name.
    const names = await resolveMemberNames(guildId, tickets.map((t) => t.userId));
    res.json({
      tickets: tickets.map((t) => ({ ...t, userName: names[t.userId]?.name ?? null })),
      stats: {
        total,
        open,
        closed,
        avgFirstResponseMins: agg.avgFirstResponseMins == null
          ? null
          : Math.round(Number(agg.avgFirstResponseMins) * 10) / 10,
        avgCsat: agg.avgCsat == null ? null : Math.round(Number(agg.avgCsat) * 100) / 100,
      },
    });
  } catch (err) {
    console.warn(`[ModulesAPI] Load tickets failed for guild ${guildId}:`, err.message);
    res.status(500).json({ error: 'Failed to load tickets' });
  }
});

router.get('/:guildId/tickets/csat', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;
  try {
    const { TicketCSAT } = sequelize.models;
    if (!TicketCSAT) {
      return res.json({ csat: { avgRating: null, count: 0, satisfiedPct: null, recent: [] } });
    }

    const [count, satisfied, aggregate, recent] = await Promise.all([
      TicketCSAT.count({ where: { guildId } }),
      TicketCSAT.count({ where: { guildId, rating: { [sequelize.Op.gte]: 4 } } }),
      TicketCSAT.findAll({
        attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'avgRating']],
        where: { guildId },
        raw: true,
      }),
      TicketCSAT.findAll({
        where: { guildId },
        attributes: ['ticketId', 'rating', 'feedback', 'staffId', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: 25,
        raw: true,
      }),
    ]);

    const rawAvg = aggregate?.[0]?.avgRating;
    res.json({
      csat: {
        avgRating: rawAvg == null ? null : Math.round(Number(rawAvg) * 100) / 100,
        count,
        satisfiedPct: count > 0 ? Math.round((satisfied / count) * 1000) / 10 : null,
        recent,
      },
    });
  } catch (err) {
    console.warn(`[ModulesAPI] Load CSAT metrics failed for guild ${guildId}:`, err.message);
    res.status(500).json({ error: 'Failed to load CSAT metrics' });
  }
});

// ── 8b. Engagement — Giveaways, Messages & Utilities ──────────
router.get('/:guildId/giveaways', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;
  try {
    const { Giveaway, GiveawayEntry } = sequelize.models;
    const giveaways = Giveaway
      ? await Giveaway.findAll({
        where: { guildId },
        attributes: ['id', 'channelId', 'prize', 'winnerCount', 'endsAt', 'active', 'winners', 'hostId', 'requirements'],
        order: [['createdAt', 'DESC'], ['id', 'DESC']],
        limit: 50,
        raw: true,
      })
      : [];

    const entryCounts = {};
    if (GiveawayEntry && giveaways.length > 0) {
      const grouped = await GiveawayEntry.findAll({
        attributes: ['giveawayId', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        where: { giveawayId: { [sequelize.Op.in]: giveaways.map((g) => g.id) } },
        group: ['giveawayId'],
        raw: true,
      });
      for (const row of grouped) entryCounts[row.giveawayId] = toInt(row.count);
    }

    res.json({
      giveaways: giveaways.map((g) => ({ ...g, entries: entryCounts[g.id] ?? 0 })),
    });
  } catch (err) {
    console.warn(`[ModulesAPI] Load giveaways failed for guild ${guildId}:`, err.message);
    res.status(500).json({ error: 'Failed to load giveaways' });
  }
});

router.get('/:guildId/timed-messages', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;
  try {
    const { TimedMessage } = sequelize.models;
    const messages = TimedMessage
      ? await TimedMessage.findAll({
        where: { guildId },
        attributes: ['id', 'channelId', 'content', 'interval', 'enabled', 'lastSentAt', 'nextSendAt'],
        order: [['createdAt', 'DESC']],
        raw: true,
      })
      : [];
    res.json({ messages: messages.map(timedMessageShape) });
  } catch (err) {
    console.warn(`[ModulesAPI] Load timed messages failed for guild ${guildId}:`, err.message);
    res.status(500).json({ error: 'Failed to load timed messages' });
  }
});

// Shared projection so GET/POST /timed-messages return identical field sets.
function timedMessageShape(message) {
  return {
    id: message.id,
    channelId: message.channelId,
    content: message.content,
    interval: toInt(message.interval),
    enabled: Boolean(message.enabled),
    lastSentAt: message.lastSentAt ?? null,
    nextSendAt: message.nextSendAt ?? null,
  };
}

// `interval` is an integer number of seconds — the unit the bot writes and the
// unit its sender reschedules with (nextSendAt = lastSentAt + interval * 1000).
// The bot's /timedmessage command enforces 300..604800 (5 min .. 7 days);
// mirror those canonical bounds so dashboard rows behave like bot-created ones.
const timedMessageSchema = z.object({
  id: z.number().int().positive().optional(),
  channelId: z.string().regex(SNOWFLAKE_RE),
  content: z.string().min(1).max(2000),
  interval: z.number().int().min(300).max(604800),
  enabled: z.boolean().optional(),
});

router.post('/:guildId/timed-messages', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;

  const parsed = timedMessageSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid timed message', details: parsed.error.format() });
  }

  try {
    const { TimedMessage } = sequelize.models;
    if (!TimedMessage) return res.status(503).json({ error: 'Timed messages module unavailable' });

    const { id, ...data } = parsed.data;
    if (id !== undefined) {
      // An id that isn't in this guild means the row was deleted — 404 instead
      // of silently creating a second message.
      const existing = await TimedMessage.findOne({ where: { id, guildId } });
      if (!existing) return res.status(404).json({ error: 'Timed message not found' });
      if (existing) {
        const updates = { ...data };
        // The bot's sender only picks up rows with nextSendAt <= now (NULL
        // never matches), so keep the row scheduled: re-anchor when the
        // interval changed, and repair a missing schedule.
        if (toInt(existing.interval) !== data.interval) {
          const anchor = existing.lastSentAt ? new Date(existing.lastSentAt) : new Date();
          updates.nextSendAt = new Date(anchor.getTime() + data.interval * 1000);
        } else if (!existing.nextSendAt) {
          updates.nextSendAt = new Date(Date.now() + data.interval * 1000);
        }
        await existing.update(updates);
        return res.json({ message: timedMessageShape(existing) });
      }
    }

    const message = await TimedMessage.create({
      ...data,
      guildId,
      nextSendAt: new Date(Date.now() + data.interval * 1000),
    });
    res.json({ message: timedMessageShape(message) });
  } catch (err) {
    console.warn(`[ModulesAPI] Save timed message failed for guild ${guildId}:`, err.message);
    res.status(500).json({ error: 'Failed to save timed message' });
  }
});

router.delete('/:guildId/timed-messages/:id', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid message id' });
  }

  try {
    const { TimedMessage } = sequelize.models;
    if (TimedMessage) {
      await TimedMessage.destroy({ where: { id, guildId } });
    }
    res.json({ ok: true });
  } catch (err) {
    console.warn(`[ModulesAPI] Delete timed message failed for guild ${guildId}:`, err.message);
    res.status(500).json({ error: 'Failed to delete timed message' });
  }
});

router.get('/:guildId/auto-responders', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;
  try {
    const { AutoResponder } = sequelize.models;
    const responders = AutoResponder
      ? await AutoResponder.findAll({
        where: { guildId },
        attributes: ['id', 'trigger', 'triggerType', 'response', 'cooldown', 'allowedChannels', 'useAI'],
        order: [['createdAt', 'DESC']],
        raw: true,
      })
      : [];
    res.json({ responders: responders.map(autoResponderShape) });
  } catch (err) {
    console.warn(`[ModulesAPI] Load auto-responders failed for guild ${guildId}:`, err.message);
    res.status(500).json({ error: 'Failed to load auto-responders' });
  }
});

// Shared projection so GET/POST /auto-responders return identical field sets.
function autoResponderShape(responder) {
  return {
    id: responder.id,
    trigger: responder.trigger,
    triggerType: responder.triggerType,
    response: responder.response,
    cooldown: toInt(responder.cooldown),
    allowedChannels: Array.isArray(responder.allowedChannels) ? responder.allowedChannels : [],
    useAI: Boolean(responder.useAI),
  };
}

// triggerType mirrors the AutoResponder model's ENUM values exactly.
const autoResponderSchema = z.object({
  id: z.number().int().positive().optional(),
  trigger: z.string().min(1).max(200),
  triggerType: z.enum(['exact', 'contains', 'startsWith', 'regex']),
  response: z.string().min(1).max(2000),
  cooldown: z.number().int().min(0).max(2147483647),
  allowedChannels: z.array(z.string().regex(SNOWFLAKE_RE)).nullable().optional(),
  useAI: z.boolean().optional(),
});

router.post('/:guildId/auto-responders', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;

  const parsed = autoResponderSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid auto-responder', details: parsed.error.format() });
  }

  // The bot's /autoresponder command rejects malformed regex patterns; do the
  // same here so the dashboard can't persist one.
  if (parsed.data.triggerType === 'regex') {
    try {
      new RegExp(parsed.data.trigger);
    } catch (e) {
      return res.status(400).json({ error: `Invalid regex trigger: ${e.message}` });
    }
  }

  try {
    const { AutoResponder } = sequelize.models;
    if (!AutoResponder) return res.status(503).json({ error: 'Auto-responders module unavailable' });

    const { id, ...data } = parsed.data;
    if (id !== undefined) {
      // An id that isn't in this guild means the row was deleted — 404 instead
      // of silently creating a duplicate responder.
      const existing = await AutoResponder.findOne({ where: { id, guildId } });
      if (!existing) return res.status(404).json({ error: 'Auto-responder not found' });
      if (existing) {
        await existing.update(data);
        await invalidateAutoResponderCache(guildId);
        return res.json({ responder: autoResponderShape(existing) });
      }
    }

    const responder = await AutoResponder.create({ ...data, guildId });
    await invalidateAutoResponderCache(guildId);
    res.json({ responder: autoResponderShape(responder) });
  } catch (err) {
    console.warn(`[ModulesAPI] Save auto-responder failed for guild ${guildId}:`, err.message);
    res.status(500).json({ error: 'Failed to save auto-responder' });
  }
});

router.delete('/:guildId/auto-responders/:id', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid responder id' });
  }

  try {
    const { AutoResponder } = sequelize.models;
    if (AutoResponder) {
      await AutoResponder.destroy({ where: { id, guildId } });
    }
    await invalidateAutoResponderCache(guildId);
    res.json({ ok: true });
  } catch (err) {
    console.warn(`[ModulesAPI] Delete auto-responder failed for guild ${guildId}:`, err.message);
    res.status(500).json({ error: 'Failed to delete auto-responder' });
  }
});

router.get('/:guildId/reaction-roles', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;
  try {
    const { ReactionRole } = sequelize.models;
    const reactionRoles = ReactionRole
      ? await ReactionRole.findAll({
        where: { guildId },
        attributes: ['id', 'channelId', 'messageId', 'emoji', 'roleId', 'type'],
        order: [['createdAt', 'DESC']],
        raw: true,
      })
      : [];
    res.json({ reactionRoles });
  } catch (err) {
    console.warn(`[ModulesAPI] Load reaction roles failed for guild ${guildId}:`, err.message);
    res.status(500).json({ error: 'Failed to load reaction roles' });
  }
});

router.get('/:guildId/starboard', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;
  try {
    const s = await getGuildSettings(guildId);
    const { StarboardEntry } = sequelize.models;
    const entries = StarboardEntry
      ? await StarboardEntry.findAll({
        where: { guildId },
        attributes: ['messageId', 'channelId', 'authorId', 'starCount', 'starboardMsgId', 'createdAt'],
        order: [['starCount', 'DESC']],
        limit: 20,
        raw: true,
      })
      : [];
    res.json({
      config: {
        enabled: Boolean(s?.starboardEnabled),
        channelId: s?.starboardChannelId ?? null,
        threshold: s?.starboardThreshold ?? 3,
        emoji: s?.starboardEmoji || '⭐',
      },
      entries,
    });
  } catch (err) {
    console.warn(`[ModulesAPI] Load starboard failed for guild ${guildId}:`, err.message);
    res.status(500).json({ error: 'Failed to load starboard' });
  }
});

// Persist the starboard config to the same GuildSettings columns GET /starboard reads.
const starboardConfigSchema = z.object({
  enabled: z.boolean(),
  channelId: z.string().regex(SNOWFLAKE_RE).nullable(),
  threshold: z.number().int().min(1).max(100),
  emoji: z.string().max(50),
});

router.post('/:guildId/starboard', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;

  const parsed = starboardConfigSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid starboard configuration', details: parsed.error.format() });
  }

  try {
    const s = await getGuildSettings(guildId);
    if (settingsUnavailable(s)) return res.status(503).json({ error: 'Settings unavailable' });

    const { enabled, channelId, threshold, emoji } = parsed.data;
    await s.update({
      starboardEnabled: enabled,
      starboardChannelId: channelId,
      starboardThreshold: threshold,
      starboardEmoji: emoji,
    });

    res.json({
      ok: true,
      config: {
        enabled: Boolean(s.starboardEnabled),
        channelId: s.starboardChannelId ?? null,
        threshold: s.starboardThreshold ?? 3,
        emoji: s.starboardEmoji || '⭐',
      },
    });
  } catch (err) {
    console.warn(`[ModulesAPI] Save starboard config failed for guild ${guildId}:`, err.message);
    res.status(500).json({ error: 'Failed to save starboard configuration' });
  }
});

// Fresh welcome/farewell payload — shared by GET and POST /welcome.
function buildWelcomePayload(s) {
  // welcomeCard is a real GuildSettings column (BOOLEAN). It is exposed both
  // inside `welcome` and as a flat alias, because the POST body uses the flat
  // `welcomeCard` field name — clients that read that name back from the GET
  // response find it in both places.
  const welcomeCard = Boolean(s?.welcomeCard);
  return {
    welcomeCard,
    welcome: {
      enabled: Boolean(s?.welcomeEnabled),
      message: s?.welcomeMessage ?? null,
      channelId: s?.welcomeChannelId ?? null,
      welcomeCard,
      config: s?.welcomeConfig && typeof s.welcomeConfig === 'object' && !Array.isArray(s.welcomeConfig)
        ? s.welcomeConfig
        : {},
    },
    farewell: {
      enabled: Boolean(s?.farewellEnabled),
      message: s?.farewellMessage ?? null,
      channelId: s?.farewellChannelId ?? null,
    },
  };
}

router.get('/:guildId/welcome', requireAuth, requireGuildAdmin, async (req, res) => {
  const s = await getGuildSettings(req.params.guildId);
  // A failed settings read (SETTINGS_UNAVAILABLE) must not be reported as
  // "everything disabled" — that is indistinguishable from a real "off".
  if (settingsUnavailable(s)) {
    return res.status(503).json({ error: 'Settings unavailable' });
  }
  res.json(buildWelcomePayload(s));
});

const welcomeUpdateSchema = z.object({
  welcomeEnabled: z.boolean().optional(),
  welcomeMessage: z.string().max(2000).optional(),
  welcomeChannelId: z.string().regex(SNOWFLAKE_RE).nullable().optional(),
  welcomeCard: z.boolean().optional(),
  farewellEnabled: z.boolean().optional(),
  farewellMessage: z.string().max(2000).optional(),
  farewellChannelId: z.string().regex(SNOWFLAKE_RE).nullable().optional(),
  welcomeConfig: safeRecord.optional(),
});

router.post('/:guildId/welcome', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;

  const parsed = welcomeUpdateSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid welcome configuration', details: parsed.error.format() });
  }
  const data = parsed.data;
  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'At least one welcome field is required' });
  }

  try {
    const s = await getGuildSettings(guildId);
    if (settingsUnavailable(s)) return res.status(503).json({ error: 'Settings unavailable' });

    const updates = {};
    if (data.welcomeEnabled !== undefined) updates.welcomeEnabled = data.welcomeEnabled;
    if (data.welcomeMessage !== undefined) updates.welcomeMessage = data.welcomeMessage;
    if (data.welcomeChannelId !== undefined) updates.welcomeChannelId = data.welcomeChannelId;
    if (data.welcomeCard !== undefined) updates.welcomeCard = data.welcomeCard;
    if (data.farewellEnabled !== undefined) updates.farewellEnabled = data.farewellEnabled;
    if (data.farewellMessage !== undefined) updates.farewellMessage = data.farewellMessage;
    if (data.farewellChannelId !== undefined) updates.farewellChannelId = data.farewellChannelId;
    if (data.welcomeConfig !== undefined) {
      const existing = s.welcomeConfig && typeof s.welcomeConfig === 'object' && !Array.isArray(s.welcomeConfig)
        ? s.welcomeConfig
        : {};
      updates.welcomeConfig = { ...existing, ...data.welcomeConfig };
    }

    await s.update(updates);
    res.json({ ok: true, ...buildWelcomePayload(s) });
  } catch (err) {
    console.warn(`[ModulesAPI] Save welcome settings failed for guild ${guildId}:`, err.message);
    res.status(500).json({ error: 'Failed to save welcome settings' });
  }
});

// ── Auto-Roles (welcome-system auto role) ──────────────────────
// Backed by the GuildSettings.autoRoleId / autoRoleDelay columns the bot's
// welcome system reads when a new member joins
// (packages/systems/welcome/welcomeSystem.js).
//
// Delay bounds: 0 (apply immediately) .. 86400 seconds (24 h). The value is stored
// verbatim in the INTEGER column; the bot applies it as
// `setTimeout(assign, delay * 1000)` (seconds) and its own /utility autorole
// command allows 0..86400 seconds, so the API must not be stricter than the bot.
const AUTO_ROLE_DELAY_MAX = 86400;

const autoRolesSchema = z.object({
  // null clears the stored role; anything else must be a Discord snowflake.
  autoRoleId: z.string().regex(SNOWFLAKE_RE).nullable().optional(),
  autoRoleDelay: z.number().int().min(0).max(AUTO_ROLE_DELAY_MAX).optional(),
});

// Shared projection so GET/POST /auto-roles return identical field sets.
// Neutral defaults (null / 0) when the column is unset — never a made-up id.
function autoRolesShape(s) {
  return {
    autoRoleId: readSetting(s, 'autoRoleId', null),
    autoRoleDelay: toInt(readSetting(s, 'autoRoleDelay', 0)),
  };
}

router.get('/:guildId/auto-roles', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;
  try {
    const s = await getGuildSettings(guildId);
    if (settingsUnavailable(s)) {
      return res.status(503).json({ error: 'Settings unavailable' });
    }
    res.json(autoRolesShape(s));
  } catch (err) {
    console.warn(`[ModulesAPI] Load auto-roles failed for guild ${guildId}:`, err.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

router.post('/:guildId/auto-roles', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;

  const parsed = autoRolesSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid auto-roles configuration' });
  }
  const data = parsed.data;
  if (data.autoRoleId === undefined && data.autoRoleDelay === undefined) {
    return res.status(400).json({ error: 'At least one auto-role field is required' });
  }

  const s = await getGuildSettings(guildId);
  if (settingsUnavailable(s)) {
    return res.status(503).json({ error: 'Settings unavailable' });
  }

  // Only the two allowlisted columns are ever written — a body-supplied
  // guildId can never redirect the update to another guild.
  const updates = {};
  if (data.autoRoleId !== undefined) updates.autoRoleId = data.autoRoleId;
  if (data.autoRoleDelay !== undefined) updates.autoRoleDelay = data.autoRoleDelay;

  try {
    await s.update(updates);
  } catch (err) {
    console.warn(`[ModulesAPI] Save auto-roles failed for guild ${guildId}:`, err.message);
    return res.status(500).json({ error: 'Internal error' });
  }

  // Respond with the persisted values only — never the raw request body.
  res.json(autoRolesShape(s));
});

// ── Applications — forms, submissions & review ────────────────
router.get('/:guildId/applications', requireAuth, requireGuildAdmin, async (req, res) => {
  try {
    const { ApplicationForm, StaffApplication } = sequelize.models;
    if (!ApplicationForm) return res.json({ enabled: false, forms: [], stats: { total: 0, pending: 0, approved: 0, rejected: 0 } });

    const forms = await ApplicationForm.findAll({
      where: { guildId: req.params.guildId },
      order: [['createdAt', 'ASC']],
    });
    const subs = await StaffApplication.findAll({
      where: { guildId: req.params.guildId },
      attributes: ['id', 'formId', 'status', 'reviewedAt', 'createdAt'],
    });

    const stats = { total: subs.length, pending: 0, approved: 0, rejected: 0 };
    for (const sub of subs) stats[sub.status] = (stats[sub.status] || 0) + 1;

    res.json({ enabled: forms.some(f => f.enabled), forms, stats });
  } catch (err) {
    console.warn('[ModulesAPI] Load applications failed:', err.message);
    res.status(500).json({ error: 'Failed to load applications' });
  }
});

router.get('/:guildId/applications/submissions', requireAuth, requireGuildAdmin, async (req, res) => {
  try {
    const { StaffApplication } = sequelize.models;
    if (!StaffApplication) return res.json([]);

    const subs = await StaffApplication.findAll({
      where: { guildId: req.params.guildId },
      order: [['createdAt', 'DESC']],
      limit: 200,
    });
    res.json(subs);
  } catch (err) {
    console.warn('[ModulesAPI] Load submissions failed:', err.message);
    res.status(500).json({ error: 'Failed to load submissions' });
  }
});

router.post('/:guildId/applications', requireAuth, requireGuildAdmin, async (req, res) => {
  try {
    const { ApplicationForm } = sequelize.models;
    if (!ApplicationForm) return res.status(503).json({ error: 'Applications module unavailable' });

    const { id, ...body } = req.body || {};
    const data = pickAllowed(body, [
      'name', 'description', 'enabled', 'questions',
      'roleRewardId', 'denyRoleId', 'removeRoleId', 'requiredRoleId',
      'pingRoleId', 'managerRoleId', 'logChannelId', 'cooldown',
    ]);

    if (id && !isUuid(id)) return res.status(400).json({ error: 'Invalid form id' });

    // Questions — Discord modals allow up to 5; keep ids/labels within modal limits
    if (data.questions !== undefined) {
      if (!Array.isArray(data.questions) || data.questions.length > 5) {
        return res.status(400).json({ error: 'questions must be an array of at most 5 items' });
      }
      const cleaned = [];
      for (let i = 0; i < data.questions.length; i += 1) {
        const q = data.questions[i];
        if (!q || typeof q !== 'object' || typeof q.label !== 'string' || !q.label.trim()) {
          return res.status(400).json({ error: `questions[${i}] needs a non-empty label` });
        }
        cleaned.push({
          id: String(q.id || `q${i + 1}`).slice(0, 90),
          label: q.label.trim().slice(0, 45),
          placeholder: String(q.placeholder || '').slice(0, 100),
          style: q.style === 'short' ? 'short' : 'paragraph',
          required: q.required !== false,
        });
      }
      data.questions = cleaned;
    }

    if (data.cooldown !== undefined) {
      const cooldown = Math.floor(Number(data.cooldown));
      if (!Number.isFinite(cooldown) || cooldown < 0 || cooldown > 31536000) {
        return res.status(400).json({ error: 'cooldown must be a non-negative number of seconds' });
      }
      data.cooldown = cooldown;
    }

    if (data.name !== undefined) data.name = String(data.name).slice(0, 100) || 'Application';
    if (data.description !== undefined) data.description = String(data.description).slice(0, 1000);

    // Discord ids must look like snowflakes (or be empty to clear)
    const ID_FIELDS = ['roleRewardId', 'denyRoleId', 'removeRoleId', 'requiredRoleId', 'pingRoleId', 'managerRoleId', 'logChannelId'];
    for (const field of ID_FIELDS) {
      if (data[field] === undefined) continue;
      if (data[field] === null || data[field] === '') { data[field] = null; continue; }
      if (!/^\d{17,20}$/.test(String(data[field]))) {
        return res.status(400).json({ error: `${field} must be a Discord id` });
      }
    }

    if (id) {
      const form = await ApplicationForm.findOne({ where: { id, guildId: req.params.guildId } });
      if (!form) return res.status(404).json({ error: 'Form not found' });
      await form.update(data);
      return res.json({ success: true, form });
    }

    const form = await ApplicationForm.create({ ...data, guildId: req.params.guildId });
    res.json({ success: true, form });
  } catch (err) {
    console.warn('[ModulesAPI] Save application form failed:', err.message);
    res.status(500).json({ error: 'Failed to save application form' });
  }
});

router.post('/:guildId/applications/submissions/:id/review', requireAuth, requireGuildAdmin, async (req, res) => {
  try {
    const { StaffApplication } = sequelize.models;
    if (!StaffApplication) return res.status(503).json({ error: 'Applications module unavailable' });
    if (!isUuid(req.params.id)) return res.status(404).json({ error: 'Application not found' });

    const { action } = req.body || {};
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'action must be "approve" or "reject"' });
    }

    const app = await StaffApplication.findOne({ where: { id: req.params.id, guildId: req.params.guildId } });
    if (!app) return res.status(404).json({ error: 'Application not found' });
    if (app.status !== 'pending') {
      return res.status(409).json({ error: `Application already ${app.status}` });
    }

    // Conditional update keeps this atomic — two reviewers can't both claim the same submission.
    // Role automation + DM notifications run bot-side when the review button is used in Discord.
    const status = action === 'approve' ? 'approved' : 'rejected';
    const [affected] = await StaffApplication.update(
      { status, moderatorId: req.user?.id || req.user?.userId || 'dashboard', reviewedAt: new Date() },
      { where: { id: app.id, status: 'pending' } },
    );
    if (!affected) return res.status(409).json({ error: 'Application was already reviewed' });

    res.json({ success: true, applicationId: app.id, status });
  } catch (err) {
    console.warn('[ModulesAPI] Review application failed:', err.message);
    res.status(500).json({ error: 'Failed to review application' });
  }
});

router.post('/:guildId/applications/:formId/toggle', requireAuth, requireGuildAdmin, async (req, res) => {
  try {
    const { ApplicationForm } = sequelize.models;
    if (!ApplicationForm) return res.status(503).json({ error: 'Applications module unavailable' });
    if (!isUuid(req.params.formId)) return res.status(404).json({ error: 'Form not found' });

    const form = await ApplicationForm.findOne({ where: { id: req.params.formId, guildId: req.params.guildId } });
    if (!form) return res.status(404).json({ error: 'Form not found' });

    await form.update({ enabled: !form.enabled });
    res.json({ success: true, enabled: form.enabled });
  } catch (err) {
    console.warn('[ModulesAPI] Toggle application form failed:', err.message);
    res.status(500).json({ error: 'Failed to update form' });
  }
});

router.delete('/:guildId/applications/:formId', requireAuth, requireGuildAdmin, async (req, res) => {
  try {
    const { ApplicationForm, StaffApplication } = sequelize.models;
    if (!ApplicationForm) return res.status(503).json({ error: 'Applications module unavailable' });
    if (!isUuid(req.params.formId)) return res.status(404).json({ error: 'Form not found' });

    const linked = await StaffApplication.count({ where: { formId: req.params.formId, guildId: req.params.guildId } }).catch(() => 0);
    if (linked > 0) {
      return res.status(409).json({ error: `Form has ${linked} submissions — disable it instead of deleting` });
    }

    try {
      const deleted = await ApplicationForm.destroy({ where: { id: req.params.formId, guildId: req.params.guildId } });
      if (!deleted) return res.status(404).json({ error: 'Form not found' });
      res.json({ success: true });
    } catch (err) {
      if (err?.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(409).json({ error: 'Form has submissions — disable it instead of deleting' });
      }
      throw err;
    }
  } catch (err) {
    console.warn('[ModulesAPI] Delete application form failed:', err.message);
    res.status(500).json({ error: 'Failed to delete form' });
  }
});

// ── 9. Verification, Roles & Channels ─────────────────────────
router.get('/:guildId/verification', requireAuth, requireGuildAdmin, async (req, res) => {
  const s = await getGuildSettings(req.params.guildId);
  res.json({
    verificationEnabled: s?.verificationEnabled ?? false,
    verificationMode: s?.verificationMode || 'web',
    verificationRoleId: s?.verificationRoleId || '',
    unverifiedRoleId: s?.unverifiedRoleId || '',
    verificationChannelId: s?.verificationChannelId || '',
    altAgeLimit: s?.altAgeLimit ?? 7,
  });
});

const verificationSchema = z.object({
  verificationEnabled: z.boolean().optional(),
  verificationMode: z.enum(['web', 'button', 'captcha']).optional(),
  verificationRoleId: discordIdField.optional(),
  unverifiedRoleId: discordIdField.optional(),
  verificationChannelId: discordIdField.optional(),
  altAgeLimit: z.number().int().min(0).max(3650).optional(),
});

router.post('/:guildId/verification', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;

  const allowedUpdates = ['verificationEnabled', 'verificationMode', 'verificationRoleId', 'unverifiedRoleId', 'verificationChannelId', 'altAgeLimit'];
  const parsed = verificationSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid verification configuration' });
  }

  const s = await getGuildSettings(guildId);
  if (settingsUnavailable(s)) {
    return res.status(503).json({ error: 'Storage unavailable' });
  }

  try {
    await s.update(pickAllowed(parsed.data, allowedUpdates));
  } catch (err) {
    console.warn(`[ModulesAPI] Save verification settings failed for guild ${guildId}:`, err.message);
    return res.status(500).json({ error: 'Internal error' });
  }

  res.json({ success: true });
});

// Live guild roles from Discord REST. NOTE: discordFetch itself performs no
// caching or dedup (only getBotGuilds does) — this route is a one-shot call.
// Never fails the dashboard: without a bot token or on any Discord error it
// returns an empty list with HTTP 200 and logs server-side.
router.get('/:guildId/roles', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;

  if (!hasBotToken()) {
    console.warn(`[ModulesAPI] Role fetch skipped for guild ${guildId}: bot token not configured`);
    return res.json({ roles: [] });
  }

  try {
    const roles = await discordFetch(`/guilds/${guildId}/roles`);
    const mapped = (Array.isArray(roles) ? roles : [])
      .map((role) => ({
        id: role.id,
        name: role.name,
        color: role.color ? `#${Number(role.color).toString(16).padStart(6, '0')}` : null,
        position: role.position ?? 0,
        managed: Boolean(role.managed),
      }))
      .sort((a, b) => b.position - a.position);
    res.json({ roles: mapped });
  } catch (err) {
    console.warn(`[ModulesAPI] Discord role fetch failed for guild ${guildId}:`, err.message);
    res.json({ roles: [] });
  }
});

// Live guild channels from Discord REST — same failure policy as /roles.
router.get('/:guildId/channels', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;

  if (!hasBotToken()) {
    console.warn(`[ModulesAPI] Channel fetch skipped for guild ${guildId}: bot token not configured`);
    return res.json({ channels: [] });
  }

  try {
    const channels = await discordFetch(`/guilds/${guildId}/channels`);
    const mapped = (Array.isArray(channels) ? channels : [])
      .map((channel) => ({
        id: channel.id,
        name: channel.name ?? null,
        type: channel.type,
        parentId: channel.parent_id ?? null,
        position: channel.position ?? 0,
      }))
      .sort((a, b) => a.position - b.position);
    res.json({ channels: mapped });
  } catch (err) {
    console.warn(`[ModulesAPI] Discord channel fetch failed for guild ${guildId}:`, err.message);
    res.json({ channels: [] });
  }
});

// ── 10. Temporary Voice ───────────────────────────────────────
router.get('/:guildId/voice', requireAuth, requireGuildAdmin, async (req, res) => {
  const s = await getGuildSettings(req.params.guildId);
  // A failed settings read must not be reported as "everything disabled" —
  // that is indistinguishable from a real "off". Answer 503 instead.
  if (settingsUnavailable(s)) {
    return res.status(503).json({ error: 'Settings unavailable' });
  }
  res.json({
    enabled: s?.tempVoiceEnabled ?? false,
    creatorChannelId: s?.tempVoiceCreatorId || '',
    categoryId: s?.tempVoiceCategoryId || '',
    nameTemplate: s?.tempVoiceNameTemplate || "🔊 {user}'s Room",
    textLinkedChannelId: s?.voiceTextLinkedChannelId || '',
  });
});

const voiceSchema = z.object({
  enabled: z.boolean().optional(),
  creatorChannelId: discordIdField.optional(),
  categoryId: discordIdField.optional(),
  nameTemplate: z.string().min(1).max(100).optional(),
  textLinkedChannelId: discordIdField.optional(),
});

router.post('/:guildId/voice', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;

  const parsed = voiceSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid temporary voice configuration' });
  }

  const s = await getGuildSettings(guildId);
  if (settingsUnavailable(s)) {
    return res.status(503).json({ error: 'Storage unavailable' });
  }

  const { enabled, creatorChannelId, categoryId, nameTemplate, textLinkedChannelId } = parsed.data;
  const updates = {};
  if (enabled !== undefined) updates.tempVoiceEnabled = enabled;
  if (creatorChannelId !== undefined) updates.tempVoiceCreatorId = creatorChannelId;
  if (categoryId !== undefined) updates.tempVoiceCategoryId = categoryId;
  if (nameTemplate !== undefined) updates.tempVoiceNameTemplate = nameTemplate;
  if (textLinkedChannelId !== undefined) updates.voiceTextLinkedChannelId = textLinkedChannelId;

  try {
    await s.update(updates);
  } catch (err) {
    console.warn(`[ModulesAPI] Save temporary voice settings failed for guild ${guildId}:`, err.message);
    return res.status(500).json({ error: 'Internal error' });
  }

  res.json({ success: true });
});

router.get('/:guildId/voice/active', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;
  try {
    const { TempChannel } = sequelize.models;
    const rooms = TempChannel
      ? await TempChannel.findAll({
        where: { guildId },
        attributes: ['channelId', 'ownerId', 'textChannelId', 'expiresAt'],
        order: [['createdAt', 'DESC']],
        raw: true,
      })
      : [];
    res.json({ rooms });
  } catch (err) {
    console.warn(`[ModulesAPI] Load active voice rooms failed for guild ${guildId}:`, err.message);
    res.status(500).json({ error: 'Failed to load active voice rooms' });
  }
});

// ── 11. Module Enablement (Module Control Hub) ────────────────
// Maps dashboard module toggles to real GuildSettings columns.
// NOTE: the UI's "economy" and "music" toggles have no backing columns
// yet; they are intentionally absent here and stay UI-local.
// NOTE: `mod` → autoModEnabled persists, but no bot/system code reads that
// column yet — the toggle has no runtime effect until the moderation path
// honors it (bot-side change, tracked separately).
const MODULE_COLUMNS = {
  mod: 'autoModEnabled',
  leveling: 'levelingEnabled',
  welcome: 'welcomeEnabled',
  tickets: 'ticketEnabled',
};

router.get('/:guildId/modules', requireAuth, requireGuildAdmin, async (req, res) => {
  const s = await getGuildSettings(req.params.guildId);
  const modules = {};
  Object.entries(MODULE_COLUMNS).forEach(([key, column]) => {
    modules[key] = Boolean(s?.[column] ?? false);
  });
  res.json(modules);
});

router.post('/:guildId/modules', requireAuth, requireGuildAdmin, async (req, res) => {
  const s = await getGuildSettings(req.params.guildId);
  // settingsUnavailable (not `!s`): a failed read returns the sentinel, which
  // is truthy and would otherwise reach s.update().
  if (settingsUnavailable(s)) {
    return res.status(503).json({ success: false, error: 'Settings unavailable' });
  }
  const updates = {};
  Object.entries(MODULE_COLUMNS).forEach(([key, column]) => {
    if (typeof req.body?.[key] === 'boolean') updates[column] = req.body[key];
  });
  try {
    await s.update(updates);
  } catch (err) {
    console.warn(`[ModulesAPI] Failed to save module toggles for guild ${req.params.guildId}:`, err.message);
    return res.status(500).json({ success: false, error: 'Failed to save module settings' });
  }
  res.json({ success: true });
});

// ── 12. Members (live roster from Discord REST) ───────────────
router.get('/:guildId/members', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;

  if (!hasBotToken()) {
    return res.status(503).json({ error: 'Bot token not configured' });
  }

  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

  let members;
  try {
    members = await discordFetch(
      `/guilds/${guildId}/members?limit=100${q ? `&query=${encodeURIComponent(q)}` : ''}`
    );
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).json({ error: 'Guild not found or bot is not a member' });
    }
    if (err.status === 403) {
      return res.status(403).json({ error: 'Forbidden: bot lacks permission to list members for this guild' });
    }
    console.warn(`[ModulesAPI] Discord member fetch failed for guild ${guildId}:`, err.message);
    return res.status(502).json({ error: 'Failed to fetch members from Discord' });
  }

  // Approximate total — best-effort; never blocks the roster response.
  let memberCount = null;
  try {
    const guild = await discordFetch(`/guilds/${guildId}?with_counts=true`);
    memberCount = guild?.approximate_member_count ?? null;
  } catch (_) {}

  res.json({
    success: true,
    memberCount,
    members: (Array.isArray(members) ? members : []).map((m) => ({
      id: m.user?.id,
      username: m.user?.username ?? 'Unknown',
      nickname: m.nick || null,
      avatar: m.user?.avatar || null,
      bot: Boolean(m.user?.bot),
      joinedAt: m.joined_at,
      roleCount: m.roles?.length ?? 0,
    })),
  });
});

// ── 13. Premium & Server Config ───────────────────────────────
router.get('/:guildId/premium', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;
  try {
    const s = await getGuildSettings(guildId);
    // A failed settings read must not be reported as "tier 0 / inactive" —
    // that is indistinguishable from a real free tier. Answer 503 instead.
    if (settingsUnavailable(s)) {
      return res.status(503).json({ error: 'Settings unavailable' });
    }
    const tier = s?.premiumTier ?? 0;
    const expiry = s?.premiumExpiry ? new Date(s.premiumExpiry) : null;
    res.json({
      tier,
      expiry: expiry ? expiry.toISOString() : null,
      active: expiry ? expiry.getTime() > Date.now() : tier > 0,
    });
  } catch (err) {
    console.warn(`[ModulesAPI] Load premium status failed for guild ${guildId}:`, err.message);
    res.status(500).json({ error: 'Failed to load premium status' });
  }
});

router.get('/:guildId/config', requireAuth, requireGuildAdmin, async (req, res) => {
  const { guildId } = req.params;
  try {
    const s = await getGuildSettings(guildId);
    res.json({
      prefix: s?.prefix || '!',
      language: s?.language || 'en',
      timezone: s?.timezone || 'UTC',
      premiumTier: s?.premiumTier ?? 0,
      premiumExpiry: s?.premiumExpiry ? new Date(s.premiumExpiry).toISOString() : null,
    });
  } catch (err) {
    console.warn(`[ModulesAPI] Load guild config failed for guild ${guildId}:`, err.message);
    res.status(500).json({ error: 'Failed to load guild config' });
  }
});

export default router;

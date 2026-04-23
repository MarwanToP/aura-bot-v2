// ================================================================
//  AURA BOT v2.0 — Web Dashboard Server
//  Refactored for Production Security & Performance
// ================================================================
import 'dotenv/config';
import express      from 'express';
import session      from 'express-session';
import helmet       from 'helmet';
import cors         from 'cors';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';
import passport      from 'passport';
import { Strategy }  from 'passport-discord';
import Redis         from 'ioredis';
import RedisStore    from 'connect-redis';
import crypto        from 'crypto';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { readdirSync, statSync } from 'fs';

import logger       from '../shared/utils/logger.js';
import redis        from '../shared/database/redis.js';
import database     from '../shared/database/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app       = express();
const httpServer = createServer(app);

const parsedPort = Number.parseInt(process.env.PORT || '3000', 10);
if (!Number.isInteger(parsedPort) || parsedPort <= 0 || parsedPort > 65535) {
  throw new Error(`Invalid PORT value: "${process.env.PORT}".`);
}
const PORT = parsedPort;
let commandCache = null; // Memory cache for command list
const configuredDiscordCallbackUrl = process.env.DISCORD_CALLBACK_URL?.trim();
const configuredDashboardUrl = process.env.DASHBOARD_URL?.trim();
const trustProxy = process.env.TRUST_PROXY === 'true' || process.env.NODE_ENV === 'production';
const dashboardDbSync = process.env.DASHBOARD_DB_SYNC === 'true';
const dashboardDbAlter = process.env.DASHBOARD_DB_ALTER === 'true';
const isProduction = process.env.NODE_ENV === 'production';
const configuredSessionSecret = process.env.SESSION_SECRET?.trim();
const forceSecureCookie = process.env.DASHBOARD_COOKIE_SECURE === 'true';
const forceInsecureCookie = process.env.DASHBOARD_COOKIE_SECURE === 'false';
const DEFAULT_DISCORD_CALLBACK_PATH = '/auth/discord/callback';
const normalizeCallbackPath = (value) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return DEFAULT_DISCORD_CALLBACK_PATH;
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
};
const configuredDiscordCallbackPath = normalizeCallbackPath(process.env.DISCORD_CALLBACK_PATH);

if (isProduction && !configuredSessionSecret) {
  throw new Error('SESSION_SECRET is required in production.');
}

const parseOriginList = (value) =>
  String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

let callbackOrigin = null;
let callbackPathFromUrl = null;
if (configuredDiscordCallbackUrl) {
  try {
    const parsedCallbackUrl = new URL(configuredDiscordCallbackUrl);
    callbackOrigin = parsedCallbackUrl.origin;
    callbackPathFromUrl = normalizeCallbackPath(parsedCallbackUrl.pathname);
  } catch (err) {
    logger.warn(`[Dashboard] Invalid DISCORD_CALLBACK_URL, cannot derive CORS origin: ${err.message}`);
  }
}
const discordCallbackPath = callbackPathFromUrl || configuredDiscordCallbackPath;
if (callbackPathFromUrl && process.env.DISCORD_CALLBACK_PATH && callbackPathFromUrl !== configuredDiscordCallbackPath) {
  logger.warn(`[Dashboard] DISCORD_CALLBACK_URL path (${callbackPathFromUrl}) overrides DISCORD_CALLBACK_PATH (${configuredDiscordCallbackPath}).`);
}

const envCorsOrigins = parseOriginList(process.env.DASHBOARD_CORS_ORIGIN);
const allowedCorsOrigins = envCorsOrigins.length > 0
  ? envCorsOrigins
  : (callbackOrigin ? [callbackOrigin] : []);

const corsOptionsDelegate = (req, callback) => {
  let origin = false;
  const requestOrigin = req.header('Origin');
  
  if (!isProduction || !requestOrigin) {
    origin = true;
  } else if (allowedCorsOrigins.length > 0) {
    if (allowedCorsOrigins.includes(requestOrigin)) {
      origin = true;
    }
  } else {
    // In production with no explicit CORS, we allow the request if it's the same host
    const host = req.get('host');
    if (requestOrigin.includes(host)) {
      origin = true;
    }
  }
  
  callback(null, { origin, credentials: true });
};

// For Socket.io, we need a separate check since it doesn't use the standard express middleware directly the same way
const ioCorsOrigin = (origin, callback) => {
  if (!isProduction || !origin) {
    callback(null, true);
    return;
  }
  
  if (allowedCorsOrigins.length > 0) {
    if (allowedCorsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  } else {
    callback(new Error('Not allowed by CORS'));
  }
};

const io        = new SocketIO(httpServer, { cors: { origin: ioCorsOrigin, credentials: true } });

// Railway and cloud proxies require trust proxy settings to handle cookies correctly.
// We force 'trust proxy' in production to ensure 'secure: true' cookies work.
if (isProduction || trustProxy) {
  app.set('trust proxy', 1);
}

const buildDiscordCallback = (req) => {
  if (configuredDiscordCallbackUrl) return configuredDiscordCallbackUrl;
  
  // If we have a dashboard URL, use it as the base
  if (configuredDashboardUrl) {
    try {
      return new URL(discordCallbackPath, configuredDashboardUrl).toString();
    } catch (err) {
      logger.warn(`[Dashboard] Invalid DASHBOARD_URL for callback fallback: ${err.message}`);
    }
  }

  // Fallback to current request host
  const host = req.get('host');
  const protocol = String(req.headers['x-forwarded-proto'] || req.protocol || 'http')
    .split(',')[0]
    .trim();
  return `${protocol}://${host}${discordCallbackPath}`;
};

const getDashboardOrigin = (req) => {
  // We prefer the current request's origin over a hardcoded one to support multiple domains/Railway aliases
  const host = req.get('host');
  const protocol = String(req.headers['x-forwarded-proto'] || req.protocol || 'http')
    .split(',')[0]
    .trim();
  const currentOrigin = `${protocol}://${host}`;

  // If hardcoded URL is different, we still allow it, but we MUST allow the current one.
  return currentOrigin;
};

const OAUTH_STATE_SESSION_KEY = 'discordOAuthState';
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

const issueDiscordOAuthState = (req) => {
  const value = crypto.randomBytes(32).toString('hex');
  req.session[OAUTH_STATE_SESSION_KEY] = {
    value,
    issuedAt: Date.now(),
  };
  return value;
};

const consumeDiscordOAuthState = (req) => {
  const state = req.session?.[OAUTH_STATE_SESSION_KEY];
  if (req.session) {
    delete req.session[OAUTH_STATE_SESSION_KEY];
  }
  return state;
};

const isValidDiscordOAuthState = (expectedStateRecord, receivedState) => {
  if (!expectedStateRecord || typeof expectedStateRecord !== 'object') return false;
  if (typeof expectedStateRecord.value !== 'string' || !expectedStateRecord.value) return false;
  if (!Number.isFinite(expectedStateRecord.issuedAt)) return false;
  if ((Date.now() - expectedStateRecord.issuedAt) > OAUTH_STATE_TTL_MS) return false;
  const expectedBuffer = Buffer.from(expectedStateRecord.value, 'utf8');
  const receivedBuffer = Buffer.from(String(receivedState || ''), 'utf8');
  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
};

const getDashboardRedirectUrl = (req, authStatus) => {
  const origin = getDashboardOrigin(req);
  return `${origin}/?auth=${encodeURIComponent(authStatus)}`;
};

// ── Middleware ────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

// Force HTTPS in production to ensure secure cookies are sent
if (isProduction) {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(`https://${req.get('host')}${req.url}`);
    }
    next();
  });
}

app.use(cors(corsOptionsDelegate));
app.use(express.json({ limit: '1mb' }));
app.use(express.static(join(__dirname, 'public')));

// ── Session ──────────────────────────────────────────────────
const useRedisSession = process.env.NODE_ENV === 'production' || process.env.DASHBOARD_USE_REDIS_SESSION === 'true';
const secureSessionCookie = forceSecureCookie
  ? true
  : (forceInsecureCookie ? false : isProduction);
const sessionOptions = {
  secret:            configuredSessionSecret || 'aura-dashboard-secret-change-me',
  resave:            false, // Recommended false for Redis to avoid race conditions
  saveUninitialized: false,
  rolling:           false, // Changed to false to prevent frequent cookie churn
  proxy:             true,  // Required when trust proxy is enabled
  cookie:            { 
    secure: secureSessionCookie,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    path: '/'
  },
};

if (useRedisSession) {
  sessionOptions.store = new RedisStore({ client: redis, prefix: 'aura:sess:' });
} else {
  logger.warn('[Dashboard] Using in-memory session store (development fallback).');
}

app.use(session(sessionOptions));

// ── Passport Initialization ──────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  // Prune the user object to only store what we need in the session.
  // This drastically reduces session size for users in many guilds.
  const prunedUser = {
    id: user.id,
    username: user.username,
    avatar: user.avatar,
    guilds: (user.guilds || [])
      .filter((g) => (Number(g.permissions) & 0x8) === 0x8)
      .map((g) => ({
        id: g.id,
        name: g.name,
        icon: g.icon,
        owner: g.owner,
        permissions: g.permissions,
      })),
  };
  done(null, prunedUser);
});
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new Strategy({
  clientID:     process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  scope:        ['identify', 'guilds'],
  // callbackURL is resolved dynamically in the routes to fix environment mismatches.
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

const ensureAuth = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  logger.warn(`[Dashboard API] Unauthorized access attempt to ${req.path} (Session ID: ${req.sessionID})`);
  res.status(401).json({ error: 'Authentication required' });
};

const isValidGuildId = (guildId) => /^\d{17,20}$/.test(String(guildId || ''));
const validateGuildIdParam = (req, res, next) => {
  if (isValidGuildId(req.params.guildId)) return next();
  res.status(400).json({ error: 'Invalid guild ID format' });
};

const getUserGuilds = (user) => (Array.isArray(user?.guilds) ? user.guilds : []);
const hasAdminPermission = (guild) => {
  const permissions = BigInt(guild?.permissions || '0');
  return (permissions & 8n) === 8n;
};
const getAdminGuilds = (user) => getUserGuilds(user).filter(hasAdminPermission);

const hasGuildAdminPermission = (guild, guildId) =>
  guild?.id === guildId && hasAdminPermission(guild);

const getAuthorizedGuild = (req, guildId) =>
  getAdminGuilds(req.user).find((guild) => hasGuildAdminPermission(guild, guildId));

const normalizeSnowflake = (value) => {
  const normalized = String(value || '').trim();
  return /^\d{17,20}$/.test(normalized) ? normalized : null;
};

const normalizeCommandName = (value) => {
  const normalized = String(value || '').trim().toLowerCase().replace(/^\/+/, '');
  return /^[a-z0-9][a-z0-9_-]{0,63}$/.test(normalized) ? normalized : null;
};

const discoverCommands = async () => {
  const discovered = [];
  const scanDir = async (dirPath) => {
    const entries = readdirSync(dirPath);
    for (const entry of entries) {
      const fullPath = join(dirPath, entry);
      if (statSync(fullPath).isDirectory()) {
        await scanDir(fullPath);
        continue;
      }
      if (!entry.endsWith('.js')) continue;

      try {
        const { default: cmd } = await import(pathToFileURL(fullPath).href);
        if (cmd?.data) {
          discovered.push({
            name: cmd.data.name,
            description: cmd.data.description,
            category: dirPath.split(/[\\/]/).pop(),
          });
        }
      } catch (err) {
        logger.warn(`[Dashboard API] Skipping command module "${fullPath}": ${err.message}`);
      }
    }
  };

  await scanDir(join(__dirname, '../aura/commands'));
  return Array.from(new Map(discovered.map((c) => [String(c.name || '').toLowerCase(), c])).values());
};

const getCommandCatalog = async () => {
  if (!commandCache) {
    commandCache = await discoverCommands();
  }
  return commandCache;
};

const allowedGuildSettingKeys = new Set([
  'language',
  'prefix',
  'timezone',
  'hijriDates',
  'modLogChannelId',
  'auditLogChannelId',
  'levelUpChannelId',
  'ticketLogChannelId',
  'birthdayChannelId',
  'starboardChannelId',
  'welcomeChannelId',
  'farewellChannelId',
  'statsChannelId',
  'muteRoleId',
  'autoRoleId',
  'autoRoleDelay',
  'birthdayRoleId',
  'verificationRoleId',
  'welcomeEnabled',
  'welcomeMessage',
  'welcomeCard',
  'farewellEnabled',
  'farewellMessage',
  'birthdayEnabled',
  'birthdayMessage',
  'levelingEnabled',
  'levelUpMessage',
  'xpMultiplier',
  'autoModEnabled',
  'aiModEnabled',
  'aiModSensitivity',
  'ticketEnabled',
  'ticketCategoryId',
  'ticketSupportRoles',
  'antiNukeEnabled',
  'antiRaidEnabled',
  'verificationEnabled',
  'tempVoiceEnabled',
  'tempVoiceCreatorId',
  'tempVoiceCategoryId',
  'tempVoiceNameTemplate',
  'starboardEnabled',
  'starboardThreshold',
  'starboardEmoji',
  'statsEnabled',
  'statsMemberChannelId',
  'statsOnlineChannelId',
  'statsBotChannelId',
  'inviteTrackEnabled',
  'aiChatEnabled',
  'aiChatChannelId',
  'socialAlertsConfig',
  'welcomeConfig',
  'commandAliases',
  'commandBlacklist',
  'disabledChannels',
  'staffSystemEnabled',
  'staffRoleIds',
]);

const sanitizeGuildUpdates = (payload) => {
  if (!payload || typeof payload !== 'object') return {};

  const updates = {};
  for (const [key, value] of Object.entries(payload)) {
    if (!allowedGuildSettingKeys.has(key) || value === undefined) continue;
    updates[key] = value;
  }

  if (Array.isArray(updates.ticketSupportRoles)) {
    updates.ticketSupportRoles = updates.ticketSupportRoles
      .map((roleId) => String(roleId).trim())
      .filter(Boolean);
  }
  if (Array.isArray(updates.staffRoleIds)) {
    updates.staffRoleIds = updates.staffRoleIds
      .map((roleId) => String(roleId).trim())
      .filter(Boolean);
  }
  if (Array.isArray(updates.commandBlacklist)) {
    updates.commandBlacklist = updates.commandBlacklist
      .map((entry) => String(entry).trim())
      .filter(Boolean);
  }
  if (updates.commandAliases && typeof updates.commandAliases === 'object' && !Array.isArray(updates.commandAliases)) {
    const normalizedAliases = {};
    for (const [rawAlias, rawTarget] of Object.entries(updates.commandAliases).slice(0, 200)) {
      const alias = String(rawAlias || '').trim().toLowerCase().replace(/^\/+/, '');
      const target = String(rawTarget || '').trim().toLowerCase().replace(/^\/+/, '');
      if (!alias || !target) continue;
      normalizedAliases[alias] = target;
    }
    updates.commandAliases = normalizedAliases;
  }
  if (Array.isArray(updates.disabledChannels)) {
    updates.disabledChannels = updates.disabledChannels
      .map((channelId) => String(channelId).trim())
      .filter(Boolean);
  }
  if (updates.aiModSensitivity && !['low', 'medium', 'high'].includes(updates.aiModSensitivity)) {
    updates.aiModSensitivity = 'medium';
  }

  return updates;
};

const sanitizeTicketPanelPayload = (payload = {}) => {
  if (!payload || typeof payload !== 'object') return {};

  const updates = {};

  if (typeof payload.panelId === 'string') {
    const panelId = payload.panelId.trim();
    if (/^[a-zA-Z0-9_-]{2,64}$/.test(panelId)) updates.panelId = panelId;
  }
  if (typeof payload.title === 'string') updates.title = payload.title.trim().slice(0, 120);
  if (typeof payload.description === 'string') updates.description = payload.description.trim().slice(0, 4000);
  if (typeof payload.image === 'string') updates.image = payload.image.trim().slice(0, 2048);
  if (typeof payload.thumbnail === 'string') updates.thumbnail = payload.thumbnail.trim().slice(0, 2048);
  if (payload.channelId != null) updates.channelId = normalizeSnowflake(payload.channelId);
  if (payload.messageId != null) updates.messageId = normalizeSnowflake(payload.messageId);
  if (typeof payload.active === 'boolean') updates.active = payload.active;

  if (Array.isArray(payload.categories)) {
    updates.categories = payload.categories
      .slice(0, 20)
      .map((category) => {
        if (!category || typeof category !== 'object') return null;
        const name = String(category.name || '').trim().slice(0, 64);
        const label = String(category.label || '').trim().slice(0, 80);
        if (!name || !label) return null;
        return {
          name,
          label,
          emoji: String(category.emoji || '').trim().slice(0, 32) || undefined,
          roleId: category.roleId == null ? null : normalizeSnowflake(category.roleId),
          color: String(category.color || '').trim().slice(0, 16) || undefined,
        };
      })
      .filter(Boolean);
  }

  return updates;
};

// ── Authentication Routes ────────────────────────────────────
app.get('/auth/discord', (req, res, next) => {
  if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_CLIENT_SECRET) {
    logger.error('[Dashboard Auth] Missing DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET.');
    return res.redirect(getDashboardRedirectUrl(req, 'misconfigured'));
  }
  const callbackURL = buildDiscordCallback(req);
  const state = issueDiscordOAuthState(req);
  logger.info(`[Dashboard Auth] Starting Discord OAuth with callback: ${callbackURL}`);
  
  req.session.save((saveErr) => {
    if (saveErr) {
      logger.error(`[Dashboard Auth] Failed to persist OAuth state: ${saveErr.message}`);
      return res.redirect(getDashboardRedirectUrl(req, 'error'));
    }
    passport.authenticate('discord', { callbackURL, state })(req, res, next);
  });
});

app.get(discordCallbackPath, (req, res, next) => {
  const discordAuthError = String(req.query.error || '').trim();
  if (discordAuthError) {
    logger.warn(`[Dashboard Auth] Discord denied auth request: ${discordAuthError}`);
    consumeDiscordOAuthState(req);
    return res.redirect(getDashboardRedirectUrl(req, 'denied'));
  }

  const expectedStateRecord = consumeDiscordOAuthState(req);
  if (!isValidDiscordOAuthState(expectedStateRecord, req.query.state)) {
    logger.warn('[Dashboard Auth] Invalid or missing OAuth state in callback.');
    return res.redirect(getDashboardRedirectUrl(req, 'invalid_state'));
  }

  const callbackURL = buildDiscordCallback(req);
  const failUrl = getDashboardRedirectUrl(req, 'failed');
  const errorUrl = getDashboardRedirectUrl(req, 'error');
  const successUrl = getDashboardRedirectUrl(req, 'ok');

  passport.authenticate('discord', { callbackURL }, (err, user, info) => {
    if (err) {
      logger.error(`[Dashboard Auth] Discord callback error: ${err.message}`);
      return res.redirect(errorUrl);
    }
    if (!user) {
      logger.warn(`[Dashboard Auth] Discord authentication failed: ${info?.message || 'No user returned'}`);
      return res.redirect(failUrl);
    }
    req.logIn(user, (loginErr) => {
      if (loginErr) {
        logger.error(`[Dashboard Auth] Session login failed: ${loginErr.message}`);
        return res.redirect(errorUrl);
      }
      
      req.session.save((saveErr) => {
        if (saveErr) {
          logger.error(`[Dashboard Auth] Session save failed: ${saveErr.message}`);
          return res.redirect(errorUrl);
        }
        return res.redirect(successUrl);
      });
    });
  })(req, res, next);
});

app.get('/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      logger.error(`[Dashboard Auth] Logout failed: ${err.message}`);
      return res.redirect(getDashboardRedirectUrl(req, 'error'));
    }
    req.session?.destroy(() => {
      res.clearCookie('connect.sid');
      res.redirect('/');
    });
  });
});

app.get('/api/me', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  
  // Developer Access Check
  const un = String(req.user.username || '').toLowerCase();
  const isDeveloper = (un.includes('3dh') || un.includes('lenin') || req.user.id === '942130377823252490');
  const adminGuilds = getAdminGuilds(req.user);

  res.json({
    id:          req.user.id,
    username:    req.user.username,
    avatar:      req.user.avatar,
    isDeveloper: isDeveloper,
    guilds:      adminGuilds // Only return guilds where user is admin
  });
});

// ── API Routes (Public/Health) ────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// ── API Routes (Protected) ────────────────────────────────────

// Global Stats
app.get('/api/stats', async (req, res) => {
  try {
    const { GuildSettings, UserProfile } = database.models;
    const [guilds, users] = await Promise.all([
      GuildSettings.count(),
      UserProfile.count()
    ]);
    res.json({ guilds, users, uptime: Math.floor(process.uptime()) });
  } catch (err) {
    logger.error(`[Dashboard API] Stats error: ${err.message}`);
    res.status(502).json({ error: 'Database synchronization failed' });
  }
});

// User's Authorized Guilds
app.get('/api/guilds', ensureAuth, async (req, res) => {
  try {
    const adminGuilds = getAdminGuilds(req.user);
    if (!adminGuilds || !Array.isArray(adminGuilds) || adminGuilds.length === 0) {
      return res.json([]);
    }

    const adminGuildIds = adminGuilds.map((g) => g.id).filter(Boolean);
    if (adminGuildIds.length === 0) return res.json([]);

    const activeGuilds = await database.models.GuildSettings.findAll({
      where: { guildId: adminGuildIds },
      attributes: ['guildId', 'premiumTier'] // Only fetch what we need to avoid crashes on missing columns
    });
    
    const settingsMap = new Map((activeGuilds || []).map((settings) => [settings.guildId, settings]));

    const merged = adminGuilds.map((guild) => {
      const settings = settingsMap.get(guild.id);
      return {
        guildId: guild.id,
        name: guild.name,
        icon: guild.icon,
        owner: guild.owner,
        permissions: guild.permissions,
        isConfigured: Boolean(settings),
        premiumTier: settings?.premiumTier || 0,
      };
    });

    res.json(merged);
  } catch (err) {
    logger.error(`[Dashboard API] Guilds error: ${err.stack || err.message}`);
    res.status(500).json({ error: 'Internal server error', details: isProduction ? undefined : err.message });
  }
});

// Specific Guild Config
app.get('/api/guilds/:guildId', ensureAuth, validateGuildIdParam, async (req, res) => {
  const { guildId } = req.params;
  const authorizedGuild = getAuthorizedGuild(req, guildId);
  if (!authorizedGuild) return res.status(403).json({ error: 'Forbidden' });

  try {
    const [settings] = await database.models.GuildSettings.findOrCreate({ where: { guildId } });
    res.json({
      ...settings.toJSON(),
      guildMeta: {
        id: authorizedGuild.id,
        name: authorizedGuild.name,
        icon: authorizedGuild.icon,
        owner: authorizedGuild.owner,
      },
    });
  } catch (err) {
    logger.error(`[Dashboard API] Guild settings error (${guildId}): ${err.message}`);
    res.status(500).json({ error: 'Error fetching guild settings' });
  }
});

// Guild Staff List (Aggregated)
app.get('/api/guilds/:guildId/staff', ensureAuth, validateGuildIdParam, async (req, res) => {
  const { guildId } = req.params;
  if (!getAuthorizedGuild(req, guildId)) return res.status(403).json({ error: 'Forbidden' });

  try {
    const staff = await database.models.StaffDuty.findAll({
      where: { guildId },
      order: [['totalDutyTime', 'DESC']],
      limit: 20
    });
    res.json(staff);
  } catch (err) {
    logger.error(`[Dashboard API] Staff list error (${guildId}): ${err.message}`);
    res.status(500).json({ error: 'Error fetching staff performance' });
  }
});

// Guild Fingerprint Logs (History)
app.get('/api/guilds/:guildId/fingerprints', ensureAuth, validateGuildIdParam, async (req, res) => {
  const { guildId } = req.params;
  if (!getAuthorizedGuild(req, guildId)) return res.status(403).json({ error: 'Forbidden' });

  try {
    const logs = await database.models.StaffFingerprint.findAll({
      where: { guildId },
      order: [['timestamp', 'DESC']],
      limit: 50
    });
    res.json(logs);
  } catch (err) {
    logger.error(`[Dashboard API] Fingerprints error (${guildId}): ${err.message}`);
    res.status(500).json({ error: 'Error fetching fingerprint logs' });
  }
});

// Detailed Analytics (Daily Trends)
app.get('/api/guilds/:guildId/analytics', ensureAuth, validateGuildIdParam, async (req, res) => {
  const { guildId } = req.params;
  if (!getAuthorizedGuild(req, guildId)) return res.status(403).json({ error: 'Forbidden' });

  try {
    // Basic aggregation of fingerprints into daily buckets
    const results = await database.query(`
      SELECT 
        DATE(timestamp) as day,
        COUNT(CASE WHEN type = 'on' THEN 1 END) as punch_ins,
        SUM(duration) as total_duration,
        SUM(tickets) as total_tickets
      FROM staff_fingerprints
      WHERE "guildId" = :guildId
      GROUP BY day
      ORDER BY day DESC
      LIMIT 30
    `, { 
      replacements: { guildId },
      type: database.QueryTypes.SELECT 
    });
    
    res.json(results);
  } catch (err) {
    logger.error(`[Dashboard API] Analytics error (${guildId}): ${err.message}`);
    res.status(500).json({ error: 'Error fetching analytics' });
  }
});

// Economy Leaderboard
app.get('/api/guilds/:guildId/leaderboard', ensureAuth, validateGuildIdParam, async (req, res) => {
  const { guildId } = req.params;
  if (!getAuthorizedGuild(req, guildId)) return res.status(403).json({ error: 'Forbidden' });

  try {
    const top = await database.models.Economy.findAll({
      where: { guildId },
      order: [['balance', 'DESC']],
      limit: 10
    });
    res.json(top);
  } catch (err) {
    logger.error(`[Dashboard API] Leaderboard error (${guildId}): ${err.message}`);
    res.status(500).json({ error: 'Error fetching leaderboard' });
  }
});

// Ticket Panels API
app.get('/api/guilds/:guildId/ticket-panels', ensureAuth, validateGuildIdParam, async (req, res) => {
  const { guildId } = req.params;
  if (!getAuthorizedGuild(req, guildId)) return res.status(403).json({ error: 'Forbidden' });

  try {
    const panels = await database.models.TicketPanel.findAll({ where: { guildId } });
    res.json(panels);
  } catch (err) {
    logger.error(`[Dashboard API] Ticket panels fetch error (${guildId}): ${err.message}`);
    res.status(500).json({ error: 'Error fetching ticket panels' });
  }
});

app.post('/api/guilds/:guildId/ticket-panels', ensureAuth, validateGuildIdParam, async (req, res) => {
  const { guildId } = req.params;
  if (!getAuthorizedGuild(req, guildId)) return res.status(403).json({ error: 'Forbidden' });

  try {
    const panelPayload = sanitizeTicketPanelPayload(req.body);
    if (!panelPayload.panelId) {
      return res.status(400).json({ error: 'panelId is required and must be 2-64 chars (letters, numbers, _ or -)' });
    }

    const [panel, created] = await database.models.TicketPanel.findOrCreate({ 
      where: { guildId, panelId: panelPayload.panelId },
      defaults: { guildId, ...panelPayload }
    });
    if (!created) await panel.update(panelPayload);
    
    // Notify bot
    redis.publish('aura:ticket_panel_update', JSON.stringify({ guildId, panelId: panel.panelId }));
    
    res.json(panel);
  } catch (err) {
    logger.error(`[Dashboard API] Ticket panel upsert error (${guildId}): ${err.message}`);
    res.status(500).json({ error: 'Error creating/updating ticket panel' });
  }
});

// Update Guild Settings (Dashboard Sync)
app.post('/api/guilds/:guildId', ensureAuth, validateGuildIdParam, async (req, res) => {
  const { guildId } = req.params;
  if (!getAuthorizedGuild(req, guildId)) return res.status(403).json({ error: 'Forbidden' });

  try {
    const updates = sanitizeGuildUpdates(req.body);
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid settings provided' });
    }

    const [settings] = await database.models.GuildSettings.findOrCreate({ where: { guildId } });
    await settings.update(updates);
    
    // Notify the bot through Redis
    redis.publish('aura:config_update', JSON.stringify({ guildId, updates }));
    
    res.json({ success: true, settings });
  } catch (err) {
    logger.error(`[Dashboard API] Update error: ${err.message}`);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

app.get('/api/guilds/:guildId/disabled-commands', ensureAuth, validateGuildIdParam, async (req, res) => {
  const { guildId } = req.params;
  if (!getAuthorizedGuild(req, guildId)) return res.status(403).json({ error: 'Forbidden' });

  try {
    const settings = await database.models.GuildSettings.findOne({
      where: { guildId },
      attributes: ['commandBlacklist'],
    });
    const commandBlacklist = Array.isArray(settings?.commandBlacklist)
      ? settings.commandBlacklist
          .map((entry) => normalizeCommandName(entry))
          .filter(Boolean)
      : [];

    res.json(commandBlacklist);
  } catch (err) {
    logger.error(`[Dashboard API] Disabled commands fetch error (${guildId}): ${err.message}`);
    res.status(500).json({ error: 'Error fetching disabled commands' });
  }
});

app.post('/api/guilds/:guildId/commands/:commandName/:action', ensureAuth, validateGuildIdParam, async (req, res) => {
  const { guildId, action } = req.params;
  if (!getAuthorizedGuild(req, guildId)) return res.status(403).json({ error: 'Forbidden' });

  const normalizedCommandName = normalizeCommandName(req.params.commandName);
  if (!normalizedCommandName) {
    return res.status(400).json({ error: 'Invalid command name format' });
  }

  if (action !== 'disable' && action !== 'enable') {
    return res.status(400).json({ error: 'Action must be "disable" or "enable"' });
  }

  try {
    const catalog = await getCommandCatalog();
    const commandExists = catalog.some((cmd) => String(cmd?.name || '').toLowerCase() === normalizedCommandName);
    if (!commandExists) {
      return res.status(404).json({ error: 'Command not found' });
    }

    const [settings] = await database.models.GuildSettings.findOrCreate({ where: { guildId } });
    const commandBlacklistSet = new Set(
      (settings.commandBlacklist || [])
        .map((entry) => normalizeCommandName(entry))
        .filter(Boolean)
    );

    if (action === 'disable') {
      commandBlacklistSet.add(normalizedCommandName);
    } else {
      commandBlacklistSet.delete(normalizedCommandName);
    }

    const commandBlacklist = Array.from(commandBlacklistSet).sort();
    await settings.update({ commandBlacklist });

    redis.publish('aura:config_update', JSON.stringify({
      guildId,
      updates: { commandBlacklist },
    }));

    res.json({
      success: true,
      commandName: normalizedCommandName,
      disabled: action === 'disable',
      commandBlacklist,
    });
  } catch (err) {
    logger.error(`[Dashboard API] Command toggle error (${guildId}/${normalizedCommandName}/${action}): ${err.message}`);
    res.status(500).json({ error: 'Failed to update command state' });
  }
});

// Command List with Memory Caching
app.get('/api/commands', async (req, res) => {
  try {
    const catalog = await getCommandCatalog();
    res.json(catalog);
  } catch (err) {
    logger.error(`[Dashboard API] Command discovery error: ${err.message}`);
    res.status(500).json({ error: 'Discovery failed' });
  }
});

// ── Socket.IO Real-time Bridge ──────────────────────────────
io.on('connection', (socket) => {
  logger.debug(`[Socket] New connection: ${socket.id}`);

  const broadcastStats = async () => {
    try {
      const [g, u] = await Promise.all([
        database.models.GuildSettings.count(),
        database.models.UserProfile.count()
      ]);
      socket.emit('stats', { guilds: g, users: u, uptime: Math.floor(process.uptime()) });
    } catch (err) {
      logger.warn(`[Socket] Failed to push stats to ${socket.id}: ${err.message}`);
    }
  };

  broadcastStats();
  const interval = setInterval(broadcastStats, 10000); 

  socket.on('disconnect', () => clearInterval(interval));
});

// ── Redis ModLog Subscription ────────────────────────────────
let modSub = null;
if (process.env.REDIS_URL) {
  modSub = new Redis(process.env.REDIS_URL, { ...(process.env.REDIS_TLS === 'true' && { tls: { rejectUnauthorized: false } }) });
  modSub.on('error', (err) => logger.warn(`[Dashboard] ModLog Redis subscriber error: ${err.message}`));
  modSub.subscribe('aura:modlogs').catch((err) => logger.warn(`[Dashboard] Failed to subscribe modlogs: ${err.message}`));
  modSub.on('message', (channel, message) => {
    if (channel === 'aura:modlogs') {
      try {
        io.emit('modLog', JSON.parse(message));
      } catch (err) {
        logger.warn(`[Dashboard] Invalid modlog payload received: ${err.message}`);
      }
    }
  });
} else {
  logger.warn('[Dashboard] REDIS_URL missing; live modlog stream disabled.');
}

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// ── Catch-all & Error Handling ──────────────────────────────
app.get('*', (req, res) => res.sendFile(join(__dirname, 'public', 'index.html')));

app.use((err, req, res, next) => {
  logger.error(`[Dashboard Server] Error: ${err.message}`);
  res.status(500).json({ error: 'Stable error boundary reached.' });
});

// ── Start ───────────────────────────────────────────────────
const start = async () => {
  try {
    const strictStartup = process.env.DASHBOARD_STRICT_STARTUP === 'true';
    let dbReady = false;
    let redisReady = false;

    try {
      await database.authenticate();
      if (dashboardDbSync) {
        logger.info(`[Dashboard] Syncing database schema (alter=${dashboardDbAlter})...`);
        await database.sync({ alter: dashboardDbAlter });
        logger.info('[Dashboard] Database schema synchronized ✓');
      }
      dbReady = true;
    } catch (err) {
      logger.error(`[Dashboard] Database unavailable: ${err.message}`);
    }

    try {
      await redis.ping();
      redisReady = true;
    } catch (err) {
      logger.error(`[Dashboard] Redis unavailable: ${err.message}`);
    }

    if (strictStartup && (!dbReady || !redisReady)) {
      throw new Error('Strict startup failed: dependencies unavailable');
    }

    if (!dbReady || !redisReady) {
      logger.warn('[Dashboard] Starting in degraded mode. Set DASHBOARD_STRICT_STARTUP=true to enforce hard-fail.');
    }
    
    httpServer.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`[Dashboard] Port ${PORT} is already in use. Exiting to avoid unhealthy process state.`);
        process.exit(1);
      } else {
        logger.error(`[Dashboard] Server error: ${err.message}`);
      }
    });

    // ── Final Error Handler (MUST BE LAST) ──────────────────────────
    app.use((err, req, res, next) => {
      logger.error(`[Dashboard Uncaught] ${err.stack || err.message}`);
      res.status(500).json({
        error: 'Critical server error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    });

    httpServer.listen(PORT, '0.0.0.0', () => {
      logger.info(`[Dashboard] Aura Neural Dashboard live on port ${PORT} ✓`);
    });
  } catch (err) {
    logger.error(`[Dashboard] Failed to start: ${err.message}`);
    process.exit(1);
  }
};

start();

let isShuttingDown = false;
const shutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info(`[Dashboard] ${signal} received — graceful shutdown...`);

  let exitCode = 0;

  io.close();

  try {
    await new Promise((resolve, reject) => {
      httpServer.close((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  } catch (err) {
    exitCode = 1;
    logger.error(`[Dashboard] HTTP server shutdown error: ${err.message}`);
  }

  try {
    await database.close();
  } catch (err) {
    exitCode = 1;
    logger.error(`[Dashboard] Database shutdown error: ${err.message}`);
  }

  try {
    await redis.quit();
  } catch (err) {
    exitCode = 1;
    logger.error(`[Dashboard] Redis shutdown error: ${err.message}`);
  }

  process.exit(exitCode);
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
export { io };

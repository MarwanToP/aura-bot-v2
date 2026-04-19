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

if (isProduction && !configuredSessionSecret) {
  throw new Error('SESSION_SECRET is required in production.');
}

const parseOriginList = (value) =>
  String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

let callbackOrigin = null;
if (configuredDiscordCallbackUrl) {
  try {
    callbackOrigin = new URL(configuredDiscordCallbackUrl).origin;
  } catch (err) {
    logger.warn(`[Dashboard] Invalid DISCORD_CALLBACK_URL, cannot derive CORS origin: ${err.message}`);
  }
}

const envCorsOrigins = parseOriginList(process.env.DASHBOARD_CORS_ORIGIN);
const allowedCorsOrigins = envCorsOrigins.length > 0
  ? envCorsOrigins
  : (callbackOrigin ? [callbackOrigin] : []);

const corsOrigin = allowedCorsOrigins.length > 0
  ? allowedCorsOrigins
  : (isProduction ? false : true);

if (isProduction && allowedCorsOrigins.length === 0) {
  logger.warn('[Dashboard] CORS is restricted in production. Set DASHBOARD_CORS_ORIGIN for cross-origin dashboard access.');
}

const io        = new SocketIO(httpServer, { cors: { origin: corsOrigin, credentials: true } });

if (trustProxy) {
  app.set('trust proxy', 1);
}

const buildDiscordCallback = (req) => {
  if (configuredDiscordCallbackUrl) return configuredDiscordCallbackUrl;
  if (configuredDashboardUrl) {
    try {
      return new URL('/auth/discord/callback', configuredDashboardUrl).toString();
    } catch (err) {
      logger.warn(`[Dashboard] Invalid DASHBOARD_URL for callback fallback: ${err.message}`);
    }
  }
  const host = req.get('host');
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  return `${protocol}://${host}/auth/discord/callback`;
};

const getDashboardOrigin = (req) => {
  if (configuredDashboardUrl) {
    try {
      return new URL(configuredDashboardUrl).origin;
    } catch (err) {
      logger.warn(`[Dashboard] Invalid DASHBOARD_URL while building redirect origin: ${err.message}`);
    }
  }
  const host = req.get('host');
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  return `${protocol}://${host}`;
};

const getDashboardRedirectUrl = (req, authStatus) => {
  const origin = getDashboardOrigin(req);
  return `${origin}/?auth=${encodeURIComponent(authStatus)}`;
};

// ── Middleware ────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.static(join(__dirname, 'public')));

// ── Session ──────────────────────────────────────────────────
const useRedisSession = process.env.NODE_ENV === 'production' || process.env.DASHBOARD_USE_REDIS_SESSION === 'true';
const secureSessionCookie = forceSecureCookie
  ? true
  : (forceInsecureCookie ? false : isProduction);
const sessionOptions = {
  secret:            configuredSessionSecret || 'aura-dashboard-secret-change-me',
  resave:            false,
  saveUninitialized: false,
  proxy:             trustProxy,
  cookie:            { 
    secure: secureSessionCookie,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax' 
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

passport.serializeUser((user, done) => done(null, user));
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
  res.status(401).json({ error: 'Authentication required' });
};

const isValidGuildId = (guildId) => /^\d{17,20}$/.test(String(guildId || ''));
const validateGuildIdParam = (req, res, next) => {
  if (isValidGuildId(req.params.guildId)) return next();
  res.status(400).json({ error: 'Invalid guild ID format' });
};

const getUserGuilds = (user) => (Array.isArray(user?.guilds) ? user.guilds : []);
const hasAdminPermission = (guild) => {
  const permissions = Number(guild?.permissions) || 0;
  return (permissions & 0x8) === 0x8;
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
  if (Array.isArray(updates.commandBlacklist)) {
    updates.commandBlacklist = updates.commandBlacklist
      .map((entry) => String(entry).trim())
      .filter(Boolean);
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
  logger.info(`[Dashboard Auth] Starting Discord OAuth with callback: ${callbackURL}`);
  
  passport.authenticate('discord', { callbackURL })(req, res, next);
});

app.get('/auth/discord/callback', (req, res, next) => {
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
      return res.redirect(successUrl);
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
    const adminGuildIds = adminGuilds.map((g) => g.id);

    const activeGuilds = await database.models.GuildSettings.findAll({
      where: { guildId: adminGuildIds },
    });
    const settingsMap = new Map(activeGuilds.map((settings) => [settings.guildId, settings]));

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
    logger.error(`[Dashboard API] Guilds error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
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

// Guild Staff List
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

// Command List with Memory Caching
app.get('/api/commands', async (req, res) => {
  if (commandCache) return res.json(commandCache);

  try {
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
              name:        cmd.data.name,
              description: cmd.data.description,
              category:    dirPath.split(/[\\/]/).pop(),
            });
          }
        } catch (err) {
          logger.warn(`[Dashboard API] Skipping command module "${fullPath}": ${err.message}`);
        }
      }
    };

    await scanDir(join(__dirname, '../aura/commands'));
    commandCache = Array.from(new Map(discovered.map(c => [c.name, c])).values());
    res.json(commandCache);
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

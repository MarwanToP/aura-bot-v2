// ================================================================
//  AURA BOT v2.0 — Web Dashboard Server
//  Express + Socket.IO real-time dashboard
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
import { RedisStore } from 'connect-redis';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import logger       from '../utils/logger.js';
import redis        from '../database/redis.js';
import database     from '../database/index.js';
import { readdirSync, statSync } from 'fs';
import { pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app       = express();
const httpServer = createServer(app);
const io        = new SocketIO(httpServer, { cors: { origin: '*' } });

const PORT = parseInt(process.env.PORT || '3000');

// ── Middleware ────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));
// ── Session ──────────────────────────────────────────────────
const redisStore = new RedisStore({ client: redis, prefix: 'aura:sess:' });

app.use(session({
  store:             redisStore,
  secret:            process.env.SESSION_SECRET || 'aura-dashboard-secret-change-me',
  resave:            false,
  saveUninitialized: false,
  cookie:            { secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 },
}));

// ── Passport Initialization ──────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new Strategy({
  clientID:     process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  callbackURL:  (process.env.DASHBOARD_URL || `http://localhost:${PORT}`) + '/auth/discord/callback',
  scope:        ['identify', 'guilds'],
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

// ── Authentication Routes ────────────────────────────────────
app.get('/auth/discord', passport.authenticate('discord'));

app.get('/auth/discord/callback', passport.authenticate('discord', {
  failureRedirect: '/',
}), (req, res) => res.redirect('/'));

app.get('/auth/logout', (req, res) => {
  req.logout(() => res.redirect('/'));
});

app.get('/api/me', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  res.json(req.user);
});

// Middleware to protect routes
const ensureAuth = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'Unauthorized' });
};

// ── API Routes ────────────────────────────────────────────────

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Bot stats
app.get('/api/stats', async (req, res) => {
  try {
    const { GuildSettings, UserProfile, ModerationCase, Ticket } = database.models;

    const [guilds, users, cases, tickets] = await Promise.all([
      GuildSettings.count(),
      UserProfile.count(),
      ModerationCase.count(),
      Ticket.count(),
    ]);

    // Redis stats
    let redisInfo = {};
    try {
      const info = await redis.info('memory');
      const usedMem = info.match(/used_memory_human:(.+)/)?.[1]?.trim() || 'N/A';
      redisInfo = { usedMemory: usedMem };
    } catch { redisInfo = { usedMemory: 'N/A' }; }

    res.json({
      bot: {
        name:    'Aura Bot v2.0',
        version: '2.0.0',
        uptime:  Math.floor(process.uptime()),
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
      database: { guilds, users, moderationCases: cases, tickets },
      redis: redisInfo,
      ai: {
        provider: process.env.AI_PROVIDER || 'gemini',
        model:    process.env.AI_CHAT_MODEL || 'gemini-2.5-flash',
        enabled:  process.env.AI_ENABLED !== 'false',
      },
    });
  } catch (err) {
    logger.error('[Dashboard] Stats error:', err.message);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Guild list
app.get('/api/guilds', async (req, res) => {
  try {
    const { GuildSettings } = database.models;
    const guilds = await GuildSettings.findAll({
      attributes: ['guildId', 'language', 'premiumTier', 'welcomeEnabled', 'ticketEnabled', 'levelingEnabled', 'aiChatEnabled'],
      order: [['createdAt', 'DESC']],
    });
    res.json(guilds);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch guilds' });
  }
});

// Guild detail
app.get('/api/guilds/:guildId', async (req, res) => {
  try {
    const { GuildSettings, UserProfile, ModerationCase, Ticket } = database.models;
    const guildId = req.params.guildId;

    const [settings, userCount, caseCount, ticketCount] = await Promise.all([
      GuildSettings.findByPk(guildId),
      UserProfile.count({ where: { guildId } }),
      ModerationCase.count({ where: { guildId } }),
      Ticket.count({ where: { guildId } }),
    ]);

    if (!settings) return res.status(404).json({ error: 'Guild not found' });

    res.json({ settings, stats: { users: userCount, cases: caseCount, tickets: ticketCount } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch guild' });
  }
});

// Update Guild Settings
app.patch('/api/guilds/:guildId/settings', ensureAuth, async (req, res) => {
  try {
    const { GuildSettings } = database.models;
    const guildId = req.params.guildId;
    const updates = req.body;

    // Check if user has access to this guild
    const userGuilds = req.user.guilds || [];
    const isOwner = userGuilds.find(g => g.id === guildId && (g.permissions & 0x8)); // Administrator
    const isManager = userGuilds.find(g => g.id === guildId && (g.permissions & 0x20)); // Manage Guild
    
    if (!isOwner && !isManager) return res.status(403).json({ error: 'Insufficient permissions' });

    const [settings] = await GuildSettings.upsert({ ...updates, guildId });
    res.json(settings);
    
    logger.info(`[Dashboard] Settings updated for guild ${guildId} by ${req.user.username}`);
  } catch (err) {
    logger.error('[Dashboard] Patch error:', err.message);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Staff Applications
app.get('/api/guilds/:guildId/applications', ensureAuth, async (req, res) => {
  try {
    const { StaffApplication } = database.models;
    const apps = await StaffApplication.findAll({
      where: { guildId: req.params.guildId },
      order: [['createdAt', 'DESC']],
    });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

app.patch('/api/applications/:appId', ensureAuth, async (req, res) => {
  try {
    const { StaffApplication } = database.models;
    const app = await StaffApplication.findByPk(req.params.appId);
    if (!app) return res.status(404).json({ error: 'Application not found' });
    
    // Check permissions
    const gId = app.guildId;
    const userGuilds = req.user.guilds || [];
    const isManager = userGuilds.find(g => g.id === gId && (g.permissions & 0x20));
    if (!isManager) return res.status(403).json({ error: 'Forbidden' });

    await app.update({ ...req.body, moderatorId: req.user.id });
    res.json(app);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// Recent moderation cases
app.get('/api/moderation/recent', async (req, res) => {
  try {
    const { ModerationCase } = database.models;
    const cases = await ModerationCase.findAll({
      order: [['createdAt', 'DESC']],
      limit: 20,
    });
    res.json(cases);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cases' });
  }
});

// Leaderboard
app.get('/api/guilds/:guildId/leaderboard', async (req, res) => {
  try {
    const { UserProfile } = database.models;
    const users = await UserProfile.findAll({
      where: { guildId: req.params.guildId },
      order: [['xp', 'DESC']],
      limit: 25,
      attributes: ['userId', 'xp', 'level', 'totalMessages'],
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Command list
app.get('/api/commands', async (req, res) => {
  try {
    const commands = [];
    const scanDir = async (dirPath) => {
      for (const entry of readdirSync(dirPath)) {
        const full = join(dirPath, entry);
        if (statSync(full).isDirectory()) {
          await scanDir(full);
          continue;
        }
        if (!entry.endsWith('.js')) continue;
        try {
          const mod = await import(pathToFileURL(full).href);
          const processMod = (m) => {
            if (m?.data && m?.execute) {
              commands.push({
                name: m.data.name,
                description: m.data.description,
                category: dirPath.split(/[\\/]/).pop(),
                options: m.data.options?.length || 0
              });
            }
          };
          if (mod.default) processMod(mod.default);
          for (const val of Object.values(mod)) processMod(val);
        } catch {}
      }
    };

    await scanDir(join(__dirname, '../commands'));
    await scanDir(join(__dirname, '../systems'));

    // Remove duplicates by name
    const unique = Array.from(new Map(commands.map(c => [c.name, c])).values());
    res.json(unique);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch commands' });
  }
});

// Subscriptions info
app.get('/api/subscriptions', (req, res) => {
  res.json([
    { id: 'free', name: 'Free', price: '0', color: '#8b8b9e', features: ['AI Chat (Limited)', 'Basic Moderation', 'Economy', 'Leveling'] },
    { id: 'premium', name: 'Premium', price: '4.99', color: '#CA8A04', features: ['Unlimited AI Chat', 'Custom Automations (100)', 'Timed Messages', 'Premium Embeds', 'Priority Support'] },
    { id: 'dev', name: 'Developer Tools', price: 'Exclusive', color: '#00cec9', features: ['Code Injection', 'Database Explorer', 'System Metrics (Detailed)', 'API Access'], exclusive: 'Lenin' }
  ]);
});

// ── Socket.IO Real-time ──────────────────────────────────────
io.on('connection', (socket) => {
  logger.info(`[Dashboard] Client connected: ${socket.id}`);

  // Send initial stats
  const sendStats = async () => {
    try {
      const { GuildSettings, UserProfile } = database.models;
      const [guilds, users] = await Promise.all([GuildSettings.count(), UserProfile.count()]);
      socket.emit('stats', {
        guilds, users,
        uptime:  Math.floor(process.uptime()),
        memory:  Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        timestamp: new Date().toISOString(),
      });
    } catch {}
  };

  sendStats();
  const interval = setInterval(sendStats, 5000);

  socket.on('disconnect', () => {
    clearInterval(interval);
    logger.info(`[Dashboard] Client disconnected: ${socket.id}`);
  });
});

// ── Serve frontend (SPA fallback) ─────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// ── Boot ───────────────────────────────────────────────────────
async function startDashboard() {
  try {
    // ── 1. Bind to port immediately (Prevents Render Port Scan Timeout) ──
    httpServer.listen(PORT, '0.0.0.0', () => {
      logger.info(`[Dashboard] ✨ Dashboard listening on port ${PORT}`);
    });

    // ── 2. Background Connections ─────────────────────────────────────
    database.authenticate()
      .then(() => logger.info('[Dashboard] Database connected ✓'))
      .catch(err => logger.error('[Dashboard] Database connection failed:', err.message));

    redis.ping()
      .then(() => logger.info('[Dashboard] Redis connected ✓'))
      .catch(err => logger.error('[Dashboard] Redis connection failed:', err.message));

  } catch (err) {
    logger.error('[Dashboard] Boot failed:', err);
  }
}

startDashboard();
export { io };

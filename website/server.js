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
const io        = new SocketIO(httpServer, { cors: { origin: '*' } });

const PORT = parseInt(process.env.PORT || '3000');
let commandCache = null; // Memory cache for command list

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
  cookie:            { 
    secure: process.env.NODE_ENV === 'production', 
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax' 
  },
}));

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

// ── Authentication Routes ────────────────────────────────────
app.get('/auth/discord', (req, res, next) => {
  const host = req.get('host');
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const dynamicCallback = `${protocol}://${host}/auth/discord/callback`;
  
  passport.authenticate('discord', { callbackURL: dynamicCallback })(req, res, next);
});

app.get('/auth/discord/callback', (req, res, next) => {
  const host = req.get('host');
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const dynamicCallback = `${protocol}://${host}/auth/discord/callback`;

  passport.authenticate('discord', { 
    callbackURL: dynamicCallback, 
    failureRedirect: '/' 
  })(req, res, next);
}, (req, res) => res.redirect('/'));

app.get('/auth/logout', (req, res) => req.logout(() => res.redirect('/')));

app.get('/api/me', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  
  // Developer Access Check
  const un = req.user.username.toLowerCase();
  const isDeveloper = (un.includes('3dh') || un.includes('lenin') || req.user.id === '942130377823252490');

  res.json({
    id:          req.user.id,
    username:    req.user.username,
    avatar:      req.user.avatar,
    isDeveloper: isDeveloper,
    guilds:      req.user.guilds.filter(g => (parseInt(g.permissions) & 0x8) === 0x8) // Only return guilds where user is admin
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
    const adminGuildIds = req.user.guilds
      .filter(g => (parseInt(g.permissions) & 0x8) === 0x8)
      .map(g => g.id);

    const activeGuilds = await database.models.GuildSettings.findAll({
      where: { guildId: adminGuildIds }
    });
    res.json(activeGuilds);
  } catch (err) {
    logger.error(`[Dashboard API] Guilds error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Specific Guild Config
app.get('/api/guilds/:guildId', ensureAuth, async (req, res) => {
  const { guildId } = req.params;
  const isAdmin = req.user.guilds.some(g => g.id === guildId && (parseInt(g.permissions) & 0x8) === 0x8);
  if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

  try {
    const settings = await database.models.GuildSettings.findByPk(guildId);
    if (!settings) return res.status(404).json({ error: 'Guild not found' });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching guild settings' });
  }
});

// Guild Staff List
app.get('/api/guilds/:guildId/staff', ensureAuth, async (req, res) => {
  const { guildId } = req.params;
  const isAdmin = req.user.guilds.some(g => g.id === guildId && (parseInt(g.permissions) & 0x8) === 0x8);
  if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

  try {
    const staff = await database.models.StaffDuty.findAll({
      where: { guildId },
      order: [['totalDutyTime', 'DESC']],
      limit: 20
    });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching staff performance' });
  }
});

// Economy Leaderboard
app.get('/api/guilds/:guildId/leaderboard', async (req, res) => {
  const { guildId } = req.params;
  try {
    const top = await database.models.Economy.findAll({
      where: { guildId },
      order: [['balance', 'DESC']],
      limit: 10
    });
    res.json(top);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching leaderboard' });
  }
});

// Ticket Panels API
app.get('/api/guilds/:guildId/ticket-panels', ensureAuth, async (req, res) => {
  const { guildId } = req.params;
  const isAdmin = req.user.guilds.some(g => g.id === guildId && (parseInt(g.permissions) & 0x8) === 0x8);
  if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

  try {
    const panels = await database.models.TicketPanel.findAll({ where: { guildId } });
    res.json(panels);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching ticket panels' });
  }
});

app.post('/api/guilds/:guildId/ticket-panels', ensureAuth, async (req, res) => {
  const { guildId } = req.params;
  const isAdmin = req.user.guilds.some(g => g.id === guildId && (parseInt(g.permissions) & 0x8) === 0x8);
  if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

  try {
    const [panel, created] = await database.models.TicketPanel.findOrCreate({ 
      where: { guildId, panelId: req.body.panelId },
      defaults: req.body
    });
    if (!created) await panel.update(req.body);
    
    // Notify bot
    redis.publish('aura:ticket_panel_update', JSON.stringify({ guildId, panelId: panel.panelId }));
    
    res.json(panel);
  } catch (err) {
    res.status(500).json({ error: 'Error creating/updating ticket panel' });
  }
});

// Update Guild Settings (Dashboard Sync)
app.post('/api/guilds/:guildId', ensureAuth, async (req, res) => {
  const { guildId } = req.params;
  const isAdmin = req.user.guilds.some(g => g.id === guildId && (parseInt(g.permissions) & 0x8) === 0x8);
  if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

  try {
    const [settings] = await database.models.GuildSettings.findOrCreate({ where: { guildId } });
    await settings.update(req.body);
    
    // Notify the bot through Redis
    redis.publish('aura:config_update', JSON.stringify({ guildId, updates: req.body }));
    
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
        } catch {}
      }
    };

    await scanDir(join(__dirname, '../aura/commands'));
    commandCache = Array.from(new Map(discovered.map(c => [c.name, c])).values());
    res.json(commandCache);
  } catch (err) {
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
    } catch {}
  };

  broadcastStats();
  const interval = setInterval(broadcastStats, 10000); 

  socket.on('disconnect', () => clearInterval(interval));
});

// ── Redis ModLog Subscription ────────────────────────────────
const modSub = process.env.REDIS_URL 
  ? new Redis(process.env.REDIS_URL, { ...(process.env.REDIS_TLS === 'true' && { tls: { rejectUnauthorized: false } }) })
  : new Redis();

modSub.subscribe('aura:modlogs');
modSub.on('message', (channel, message) => {
  if (channel === 'aura:modlogs') {
    try { io.emit('modLog', JSON.parse(message)); } catch {}
  }
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
    await database.authenticate();
    await redis.ping();
    
    httpServer.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.warn(`[Dashboard] Port ${PORT} is already in use. Dashboard may be running in another process.`);
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
export { io };

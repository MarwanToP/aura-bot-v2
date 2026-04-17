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
import Redis         from 'ioredis';
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
app.get('/auth/discord/callback', passport.authenticate('discord', { failureRedirect: '/' }), (req, res) => res.redirect('/'));
app.get('/auth/logout', (req, res) => req.logout(() => res.redirect('/')));

app.get('/api/me', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  res.json(req.user);
});

const ensureAuth = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'Unauthorized' });
};

// ── Redis Pub/Sub for Live Dashboard ─────────────────────────
const subRedis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB) || 0,
});

subRedis.subscribe('aura:modlogs');
subRedis.on('message', (channel, message) => {
  if (channel === 'aura:modlogs') {
    try {
      const data = JSON.parse(message);
      io.emit('modLog', data);
    } catch (err) {
      logger.error('Failed to parse modlog message:', err);
    }
  }
});

// ── API Routes ──────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// Stats Overview
app.get('/api/stats', async (req, res) => {
  try {
    const { GuildSettings, UserProfile, ModerationCase, Ticket } = database.models;
    const [guilds, users, cases, tickets] = await Promise.all([
      GuildSettings.count(),
      UserProfile.count(),
      ModerationCase.count(),
      Ticket.count()
    ]);
    res.json({ guilds, users, cases, tickets, uptime: Math.floor(process.uptime()) });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Guild Operations
app.get('/api/guilds', async (req, res) => {
  try {
    const guilds = await database.models.GuildSettings.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(guilds);
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.get('/api/guilds/:guildId', async (req, res) => {
  try {
    const settings = await database.models.GuildSettings.findByPk(req.params.guildId);
    if (!settings) return res.status(404).json({ error: 'Not found' });
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.patch('/api/guilds/:guildId/settings', async (req, res) => {
  try {
    const settings = await database.models.GuildSettings.findByPk(req.params.guildId);
    if (!settings) return res.status(404).json({ error: 'Not found' });
    await settings.update(req.body);
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Applications
app.get('/api/guilds/:guildId/applications', async (req, res) => {
  try {
    const apps = await database.models.StaffApplication.findAll({
      where: { guildId: req.params.guildId },
      order: [['createdAt', 'DESC']]
    });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.patch('/api/applications/:id', async (req, res) => {
  try {
    const app = await database.models.StaffApplication.findByPk(req.params.id);
    if (!app) return res.status(404).json({ error: 'Not found' });
    await app.update(req.body);
    res.json({ success: true, app });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Command List (Automated Discovery)
app.get('/api/commands', async (req, res) => {
  try {
    const commands = [];
    const scanDir = async (dirPath) => {
      if (!readdirSync(dirPath)) return;
      for (const entry of readdirSync(dirPath)) {
        const full = join(dirPath, entry);
        if (statSync(full).isDirectory()) { await scanDir(full); continue; }
        if (!entry.endsWith('.js')) continue;
        try {
          const mod = await import(pathToFileURL(full).href);
          const process = (m) => {
            if (m?.data) commands.push({ name: m.data.name, description: m.data.description, category: dirPath.split(/[\\/]/).pop() });
          };
          if (mod.default) process(mod.default);
          for (const v of Object.values(mod)) process(v);
        } catch {}
      }
    };
    await scanDir(join(__dirname, '../commands'));
    const unique = Array.from(new Map(commands.map(c => [c.name, c])).values());
    res.json(unique);
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Subscriptions
app.get('/api/subscriptions', (req, res) => {
  res.json([
    { id: 'free', name: 'Free', price: '0', color: '#8b8b9e', features: ['AI Chat (Limited)', 'Basic Moderation', 'Economy', 'Leveling'] },
    { id: 'premium', name: 'Premium', price: '4.99', color: '#CA8A04', features: ['Unlimited AI Chat', 'Custom Automations (100)', 'Timed Messages', 'Premium Embeds', 'Priority Support'] },
    { id: 'dev', name: 'Developer Tools', price: 'Exclusive', color: '#00cec9', features: ['Code Injection', 'Database Explorer', 'System Metrics (Detailed)', 'API Access'], exclusive: 'Lenin' }
  ]);
});

// ── Socket.IO ────────────────────────────────────────────────
io.on('connection', (socket) => {
  const sendStats = async () => {
    try {
      const g = await database.models.GuildSettings.count();
      const u = await database.models.UserProfile.count();
      socket.emit('stats', { guilds: g, users: u, uptime: Math.floor(process.uptime()) });
    } catch {}
  };
  sendStats();
  const iv = setInterval(sendStats, 5000);
  socket.on('disconnect', () => clearInterval(iv));
});

// ── Boot ──────────────────────────────────────────────────────
app.get('*', (req, res) => res.sendFile(join(__dirname, 'public', 'index.html')));

// ── Service Initialization ──────────────────────────────────
async function initializeServices() {
  try {
    logger.info('[Dashboard] Verifying connections...');
    
    // 1. Database
    await database.authenticate();
    logger.info('[Dashboard] Database connection verified ✓');

    // 2. Redis
    await redis.ping();
    logger.info('[Dashboard] Redis connection verified ✓');

    // 3. AI Service (if dashboard uses it for /search or similar)
    // import aiService from '../systems/ai/aiService.js';
    // await aiService.init();

    logger.info('[Dashboard] All background services ready ✓');
  } catch (err) {
    throw new Error(`Service initialization failed: ${err.message}`);
  }
}

async function startDashboard() {
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`[Dashboard] ✨ Listening on port ${PORT} (0.0.0.0)`);
    logger.info(`[Dashboard] 🚀 View at: http://localhost:${PORT}`);
    
    // Non-blocking initialization
    initializeServices().catch(err => {
      logger.error('[Dashboard] Critical failure during background init:', err);
    });
  });
};

startDashboard();
export { io };

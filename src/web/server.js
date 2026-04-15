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
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import logger       from '../utils/logger.js';
import database     from '../database/index.js';
import redis        from '../database/redis.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app       = express();
const httpServer = createServer(app);
const io        = new SocketIO(httpServer, { cors: { origin: '*' } });

const PORT = parseInt(process.env.DASHBOARD_PORT || '3000');

// ── Middleware ────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));
app.use(session({
  secret:            process.env.SESSION_SECRET || 'aura-dashboard-secret-change-me',
  resave:            false,
  saveUninitialized: false,
  cookie:            { secure: false, maxAge: 24 * 60 * 60 * 1000 },
}));

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
    await database.authenticate();
    logger.info('[Dashboard] Database connected ✓');

    await redis.ping();
    logger.info('[Dashboard] Redis connected ✓');

    httpServer.listen(PORT, () => {
      logger.info(`[Dashboard] ✨ Dashboard running at http://localhost:${PORT}`);
    });
  } catch (err) {
    logger.error('[Dashboard] Boot failed:', err);
    process.exit(1);
  }
}

startDashboard();
export { io };

import express from 'express';
import { createServer } from 'http';
import cookieParser from 'cookie-parser';
import next from 'next';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { env } from '../../../packages/config/src/env.js';
import { helmetMiddleware, cspMiddleware, corsMiddleware, apiRateLimiter } from './middleware/security.js';
import authRoutes from './api/auth.js';
import guildRoutes from './api/guilds.js';
import moduleRoutes from './api/modules.js';
import commandRoutes from './api/commands.js';
import statsRoutes from './api/stats.js';
import { initTelemetrySocket } from './sockets/telemetry.js';

// Keep the dashboard process alive on stray async errors, mirroring the bot
// (apps/bot/src/index.js). Express 4 does not catch rejections from async
// route handlers; without this, a transient DB error can kill the service.
process.on('unhandledRejection', (reason) => {
  console.error('🚨 Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('🚨 Uncaught Exception thrown:', err);
});

const __dirname = dirname(fileURLToPath(import.meta.url));
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev, dir: join(__dirname, '..') });
const handle = nextApp.getRequestHandler();

const app = express();
const httpServer = createServer(app);

// 1. Global Security Middlewares
app.use(helmetMiddleware);
app.use(cspMiddleware);
app.use(corsMiddleware);
app.use(express.json());
app.use(cookieParser());
app.use('/api/', apiRateLimiter);

// 2. Health Check Endpoint
app.get(['/health', '/api/health'], (req, res) => {
  res.status(200).json({ status: 'ok', service: 'aura-dashboard', uptime: process.uptime() });
});

// 3. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/guilds', guildRoutes);
// Module config endpoints are also served under /api/guilds/* — the paths the dashboard UI fetches.
app.use('/api/guilds', moduleRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/commands', commandRoutes);
app.use('/api/stats', statsRoutes);

// 3b. Terminal Express error handler. Express 4 only catches synchronous
// throws from handlers, so an async rejection (or any error forwarded with
// next(err)) would otherwise leave the socket open until the client times out.
// Registered after every route mount — and again below, after the Next
// page-renderer catch-all — so no request can ever hang unanswered.
// NOTE: async rejections from route handlers are NOT forwarded by Express 4;
// those are handled per-route in the API modules.
function terminalErrorHandler(err, req, res, next) {
  // Honor client-error statuses carried by well-known errors (e.g. body-parser
  // JSON syntax errors set err.status = 400) instead of masking them as 500.
  const carried = Number(err?.status || err?.statusCode);
  const isClientError = Number.isInteger(carried) && carried >= 400 && carried < 500;
  const status = isClientError ? carried : 500;
  if (!isClientError) console.error('🚨 Unhandled request error:', err);
  if (res.headersSent) return next(err);
  res.status(status).json({ error: isClientError ? err.message || 'Bad request' : 'Internal error' });
}
app.use(terminalErrorHandler);

// 4. Initialize Socket.io Telemetry Server
initTelemetrySocket(httpServer);

// 5. Next.js Frontend Page Renderer for UI
async function startServer() {
  try {
    await nextApp.prepare();
    console.log('✨ Next.js Frontend Intelligence Engine ready');
    
    app.all('*', (req, res) => {
      return handle(req, res);
    });
  } catch (err) {
    console.warn('⚠️ Next.js prepare fallback:', err.message);
  }

  // Registered last so it also terminates errors raised by the page renderer.
  app.use(terminalErrorHandler);

  // In dev the API runs alongside the Next dev server (port 3000), so it stays
  // on 3001 regardless of PORT in .env. In production it serves the built app
  // and honors PORT.
  const PORT = env.NODE_ENV === 'production' ? (env.PORT || 3000) : 3001;
  httpServer.listen(PORT, () => {
    console.log(`🚀 Aura Dashboard running on http://localhost:${PORT}`);
  });
}

startServer();

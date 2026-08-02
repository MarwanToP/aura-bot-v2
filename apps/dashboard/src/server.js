import express from 'express';
import { createServer } from 'http';
import cookieParser from 'cookie-parser';
import next from 'next';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { env } from '../../../packages/config/src/env.js';
import { helmetMiddleware, corsMiddleware, apiRateLimiter } from './middleware/security.js';
import authRoutes from './api/auth.js';
import guildRoutes from './api/guilds.js';
import moduleRoutes from './api/modules.js';
import { initTelemetrySocket } from './sockets/telemetry.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev, dir: join(__dirname, '..') });
const handle = nextApp.getRequestHandler();

const app = express();
const httpServer = createServer(app);

// 1. Global Security Middlewares
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(express.json());
app.use(cookieParser());
app.use('/api/', apiRateLimiter);

// 2. Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'aura-dashboard', uptime: process.uptime() });
});

// 3. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/guilds', guildRoutes);
app.use('/api/modules', moduleRoutes);

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

  const PORT = env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`🚀 Aura Dashboard running on http://localhost:${PORT}`);
  });
}

startServer();

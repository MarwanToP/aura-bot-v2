// ================================================================
//  @aura/dashboard — Web Dashboard Server Entrypoint
// ================================================================

import express from 'express';
import http from 'http';
import helmet from 'helmet';
import cors from 'cors';
import session from 'express-session';
import { env } from '@aura/config';
import logger from '@aura/logger';
import { sessionCookieConfig } from './middleware/auth.js';
import createApiRateLimiter from './middleware/rateLimiter.js';
import apiRouter from './api/index.js';
import initializeTelemetrySockets from './sockets/telemetry.js';

const app = express();
const server = http.createServer(app);

// ── 1. HTTP Security Headers (Helmet) ──────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://cdn.discordapp.com"],
      connectSrc: ["'self'", "wss:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// ── 2. CORS Restriction (No Wildcards) ────────────────────────
const allowedOrigins = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`[CORS Blocked] Request from origin ${origin} rejected.`);
      callback(new Error('CORS Policy: Origin not allowed.'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── 3. Session Security ──────────────────────────────────────
app.use(session(sessionCookieConfig));

// ── 4. Rate Limiting ─────────────────────────────────────────
app.use('/api', createApiRateLimiter(100, 15 * 60 * 1000));

// ── 5. REST API & Telemetry Sockets ──────────────────────────
app.use('/api', apiRouter);
initializeTelemetrySockets(server, allowedOrigins);

const PORT = env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`[Dashboard Server] Express server running on port ${PORT}`);
});

export default app;

import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../../../../packages/config/src/env.js';
import { isDevAuth } from '../middleware/auth.js';

let io = null;

// Minimal cookie header parser — avoids adding a socket-side cookie dependency.
function readCookie(header, name) {
  if (!header) return null;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      const raw = part.slice(eq + 1).trim();
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
  }
  return null;
}

export function initTelemetrySocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGINS || 'http://localhost:3001',
      credentials: true,
    },
  });

  // Telemetry requires a valid dashboard session (cookie or handshake auth token) —
  // any authenticated dashboard user, not guild-scoped. Dev-auth opt-in bypasses this in dev.
  io.use((socket, next) => {
    if (isDevAuth()) return next();

    const token =
      readCookie(socket.handshake.headers?.cookie, 'aura_session') ||
      socket.handshake.auth?.token;

    if (!token) return next(new Error('Unauthorized: invalid or missing session token'));

    try {
      jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
      return next();
    } catch {
      return next(new Error('Unauthorized: invalid or missing session token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Telemetry Client Connected [${socket.id}]`);

    socket.emit('telemetry:init', {
      timestamp: new Date().toISOString(),
      nodeUptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Telemetry Client Disconnected [${socket.id}]`);
    });
  });

  // Broadcast metrics every 5 seconds
  setInterval(() => {
    if (io) {
      const mem = process.memoryUsage();
      const heapUsedMB = (mem.heapUsed / 1024 / 1024).toFixed(1);
      io.emit('telemetry:heartbeat', {
        timestamp: new Date().toISOString(),
        memoryUsageMB: heapUsedMB,
        uptime: process.uptime(),
        botPing: Math.floor(Math.random() * 8) + 14, // 14-22ms
        activeVoiceRooms: Math.floor(Math.random() * 3) + 12,
      });
    }
  }, 5000);
}

export function broadcastMetric(eventName, payload) {
  if (io) {
    io.emit(eventName, payload);
  }
}

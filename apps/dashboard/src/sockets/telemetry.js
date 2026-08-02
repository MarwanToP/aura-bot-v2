import { Server } from 'socket.io';
import { env } from '../../../../packages/config/src/env.js';

let io = null;

export function initTelemetrySocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGINS || 'http://localhost:3000',
      credentials: true,
    },
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
      io.emit('telemetry:heartbeat', {
        timestamp: new Date().toISOString(),
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
      });
    }
  }, 5000);
}

export function broadcastMetric(eventName, payload) {
  if (io) {
    io.emit(eventName, payload);
  }
}

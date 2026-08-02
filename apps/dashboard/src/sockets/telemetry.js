// ================================================================
//  @aura/dashboard — Socket.io Real-time Telemetry Server
// ================================================================

import { Server } from 'socket.io';
import logger from '@aura/logger';

export function initializeTelemetrySockets(httpServer, allowedOrigins = []) {
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins.length ? allowedOrigins : ['http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logger.info(`[Socket.io] Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      logger.info(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export default initializeTelemetrySockets;

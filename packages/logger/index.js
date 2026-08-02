// ================================================================
//  @aura/logger — Centralized Structured Logger (Winston)
// ================================================================

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const logDir = join(__dirname, '../../logs');

const { combine, timestamp, printf, colorize, errors } = winston.format;

const fmt = printf(({ level, message, timestamp, stack, ...meta }) => {
  const m = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${stack || message}${m}`;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  exitOnError: false,
  transports: [
    new winston.transports.Console({
      format: combine(colorize({ all: true }), timestamp({ format: 'HH:mm:ss' }), errors({ stack: true }), fmt),
    }),
    new DailyRotateFile({
      dirname: logDir, filename: 'aura-%DATE%.log', datePattern: 'YYYY-MM-DD',
      zippedArchive: true, maxSize: '20m', maxFiles: '14d',
      format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), fmt),
    }),
    new DailyRotateFile({
      level: 'error', dirname: logDir, filename: 'aura-error-%DATE%.log',
      datePattern: 'YYYY-MM-DD', zippedArchive: true, maxSize: '20m', maxFiles: '30d',
      format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), fmt),
    }),
  ],
});

export default logger;

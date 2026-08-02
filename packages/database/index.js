// ================================================================
//  @aura/database — Prisma & Sequelize Database Connection Manager
//  Supports Neon PostgreSQL & parameterized queries for SQLi safety
// ================================================================

import { PrismaClient } from '@prisma/client';
import sequelize from '../../shared/database/index.js';
import logger from '@aura/logger';

let prisma;

try {
  prisma = new PrismaClient();
} catch (err) {
  logger.warn('PrismaClient initialization deferred or pending migration:', err.message);
}

export { prisma, sequelize };
export default sequelize;

// ================================================================
//  @aura/database — Database Connection & Models Manager
// ================================================================

import sequelize from './models.js';
import logger from '../logger/index.js';

let prisma = null;

try {
  const { PrismaClient } = await import('@prisma/client');
  prisma = new PrismaClient();
} catch (err) {
  logger.warn('[Database] PrismaClient dynamic import deferred or pending npx prisma generate');
}

export { prisma, sequelize };
export default sequelize;

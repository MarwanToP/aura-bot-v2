const globalForPrisma = globalThis;

let prismaInstance = null;

try {
  const { PrismaClient } = await import('@prisma/client');
  prismaInstance =
    globalForPrisma.prisma ||
    new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaInstance;
  }
} catch (err) {
  console.warn('⚠️ [Database] PrismaClient dynamic import deferred or pending npx prisma generate');
}

export const prisma = prismaInstance;
export default prisma;

import { prisma } from './client.js';

async function main() {
  console.log('🌱 Seeding Aura Bot v2 Database...');

  if (!prisma) {
    console.warn('⚠️ Prisma Client not initialized. Please run `npx prisma generate` before seeding.');
    return;
  }

  const sampleGuild = await prisma.guild.upsert({
    where: { id: '123456789012345678' },
    update: {},
    create: {
      id: '123456789012345678',
      prefix: '!',
      neuralModerationEnabled: true,
    },
  });

  console.log(`✅ Sample Guild created/verified: ${sampleGuild.id}`);
}

main()
  .catch((e) => {
    console.error('❌ Database Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    if (prisma && typeof prisma.$disconnect === 'function') {
      await prisma.$disconnect();
    }
  });

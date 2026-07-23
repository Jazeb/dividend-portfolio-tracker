import { PrismaClient } from '../generated/prisma/client';
import { seedStocksAndSectors, seedProfile } from './seeds';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  await seedStocksAndSectors(prisma);
  await seedProfile(prisma);

  console.log('✅ Seed completed');
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

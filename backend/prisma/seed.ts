import { PrismaClient } from '@prisma/client';
import stocks from './psx_stocks.json';

const prisma = new PrismaClient();

async function main() {
  console.log('adding stocks');
  await prisma.stock.createMany({
    data: stocks,
    skipDuplicates: true,
  });

  console.log(`✅ Seeded ${stocks.length} stocks`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '../generated/prisma/client';
import { seedStocksAndSectors } from './seeds/stocks_sectors.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  await seedStocksAndSectors(prisma);

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

// import { PrismaClient } from '../generated/prisma/client';
// // import stocks from './psx_stocks.json';

// const prisma = new PrismaClient();
// const stocks = [
//   {
//     id: 1,
//     fullName: 'Meezan Bank',
//     symbol: 'MEBL',
//   },
// ];

// async function main() {
//   console.log('🌱 Starting database seeding...');

//   for (const stock of stocks) {
//     await prisma.stock.upsert({
//       where: {
//         symbol: stock.symbol,
//       },
//       update: {
//         fullName: stock.fullName,
//         // sector: stock.sector,
//       },
//       create: {
//         id: 1,
//         symbol: stock.symbol,
//         fullName: stock.fullName,
//         dividendYield: 10,
//         annualDividend: 28,
//         icon: 'icon',
//         currentPrice: 500,
//         sectorId: 1,
//         // sector: stock.sector,
//       },
//     });
//   }

//   console.log(`✅ Seeded ${stocks.length} stocks`);
// }

// main()
//   .catch(e => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });

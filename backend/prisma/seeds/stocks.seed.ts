import { PrismaClient } from '../../generated/prisma/client';
import stocks from './psx_stocks.json';

export async function seedStocks(prisma: PrismaClient) {
  console.log('🌱 Starting database seeding...');
  console.log(stocks);
  for (const stock of stocks) {
    await prisma.stock.upsert({
      where: {
        symbol: stock.symbol,
      },
      update: {},
      create: {
        id: 1,
        symbol: stock.symbol,
        fullName: stock.fullName,
        dividendYield: 10,
        annualDividend: 28,
        icon: 'icon',
        currentPrice: 500,
        sectorId: 1,
        // sector: stock.sector,
      },
    });
  }

  console.log(`✅ Seeded ${stocks.length} stocks`);
}

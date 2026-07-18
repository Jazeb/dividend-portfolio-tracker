import { PrismaClient } from '../../generated/prisma/client';
import rows from './psx_stocks_with_sector.json';

export async function seedStocksAndSectors(prisma: PrismaClient) {
  // 1. Collect unique sector names (preserving first-seen order)
  const uniqueSectorNames = Array.from(new Set(rows.map(r => r.sector)));
  console.log(`Found ${uniqueSectorNames.length} unique sectors.`);

  // 2. Upsert each sector and keep a name -> DB id map
  const sectorIdByName = new Map<string, number>();

  for (const name of uniqueSectorNames) {
    console.log({ name });
    const sector = await prisma.sector.upsert({
      where: { name },
      update: {},
      create: { name, icon: 'sector.icon' },
    });
    sectorIdByName.set(name, sector.id);
  }
  console.log('Sectors seeded.');

  // 3. Upsert each stock, linking it to the correct sector via sectorId
  let seeded = 0;
  let skipped = 0;

  for (const row of rows) {
    const sectorDbId = sectorIdByName.get(row.sector);
    if (sectorDbId === undefined) {
      console.warn(`No sector match for ${row.symbol} (${row.sector}), skipping.`);
      skipped++;
      continue;
    }

    await prisma.stock.upsert({
      where: { symbol: row.symbol },
      update: {
        fullName: row.fullName,
        icon: row.icon,
        sectorId: sectorDbId,
      },
      create: {
        symbol: row.symbol,
        fullName: row.fullName,
        icon: row.icon,
        sectorId: sectorDbId,
      },
    });
    seeded++;
  }

  console.log(`Done. Seeded/updated ${seeded} stocks, skipped ${skipped}.`);
}

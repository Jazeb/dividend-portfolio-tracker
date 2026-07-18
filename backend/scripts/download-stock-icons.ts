// scripts/download-icons.ts
import { PrismaClient } from '../generated/prisma/client';
import fs from 'fs';
import path from 'path';
import https from 'https';

const prisma = new PrismaClient();
const FRONTEND_OUTPUT_DIR = path.join(process.cwd(), '../frontend/src/assets/stocks'); // adjust as needed

function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    https
      .get(url, res => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
        }

        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`Status ${res.statusCode}`));
        }

        const fileStream = fs.createWriteStream(destPath);
        res.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });

        fileStream.on('error', err => {
          fs.unlink(destPath, () => {}); // cleanup partial file
          reject(err);
        });
      })
      .on('error', reject);
  });
}

async function main() {
  console.log({ FRONTEND_OUTPUT_DIR });
  if (!fs.existsSync(FRONTEND_OUTPUT_DIR)) {
    fs.mkdirSync(FRONTEND_OUTPUT_DIR, { recursive: true });
  }

  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/dividend-portal?schema=public';

  const stocks = await prisma.stock.findMany();

  console.log(`Found ${stocks.length} stocks`);

  let success = 0;
  const failed: string[] = [];

  for (const stock of stocks) {
    const url = `https://app.stockintel.com/images/logos/${stock.symbol}.svg`; // <- fill in actual pattern
    const filePath = path.join(FRONTEND_OUTPUT_DIR, `${stock.symbol}.svg`);

    try {
      await downloadFile(url, filePath);
      console.log(`✅ ${stock.symbol}`);
      success++;
    } catch (err: any) {
      console.error(`❌ ${stock.symbol}: ${err.message}`);
      failed.push(stock.symbol);
    }

    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\nDone: ${success} succeeded, ${failed.length} failed`);
  if (failed.length) console.log('Failed symbols:', failed.join(', '));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

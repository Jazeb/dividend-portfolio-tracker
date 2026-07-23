import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class HoldingService {
  constructor(private readonly prismaService: PrismaService) {}

  async getHoldingDashboard(userId: string, query: { portfolioId: string }) {
    // const where = { profileId: parseInt(userId) };
    // if (query.portfolioId !== 'all') where.portfolioId = query.portfolioId;

    const holdings = await this.prismaService.holding.findMany({
      where: { profileId: parseInt(userId), portfolioId: Number(query.portfolioId) },
      include: {
        stocks: {
          include: { sector: true },
        },
      },
    });
    const h = holdings.map(h => {
      return {
        id: h.id,
        symbol: h.stocks.symbol,
        sector: h.stocks.sector.name,
        quantity: h.quantity,
        avgPrice: h.avgPrice,
        invested: Number(h.avgPrice) * Number(h.quantity),
        currentPrice: h.stocks.currentPrice,
        annualDividend: h.stocks.annualDividend,
        marketValue: Number(h.stocks.currentPrice) * Number(h.quantity),
        yield: Number(h.stocks.annualDividend) / Number(h.stocks.annualDividend),
        yoc: Number(h.stocks.annualDividend) / Number(h.avgPrice),
        pl: (Number(h.stocks.currentPrice) - Number(h.avgPrice)) * Number(h.quantity),
      };
    });
    console.log(h);
    return h;
  }

  getHoldingsByProfile(userId: string) {
    return this.prismaService.holding.findMany({
      where: { profileId: parseInt(userId) },
      include: {
        stocks: {
          include: { sector: true },
        },
      },
    });
  }
}

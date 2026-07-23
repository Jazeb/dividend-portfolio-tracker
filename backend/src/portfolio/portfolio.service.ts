import { Injectable } from '@nestjs/common';
import { CreatePortfolioDTO } from './dto/createPortfolio.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Holding, Portfolio } from 'generated/prisma/client';
import { DividendService } from 'src/dividend/dividend.service';
import { PortfolioCalculator } from './calculators/portfolio-calculator';

@Injectable()
export class PortfolioService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly dividendService: DividendService,
  ) {}

  async getPortfolioById(portfolioId: string, profileId) {
    const portfolio = await this.prismaService.portfolio.findFirst({
      where: { id: Number(portfolioId), profileId: Number(profileId) },
      include: { holdings: { include: { stocks: { include: { sector: true } } } } },
    });
    const summary = this.getPortfolioSummary(portfolio);
    const data = {
      ...summary,
      description: portfolio?.description,
      strategy: portfolio?.strategy,
      holdings: this.mapHoldings(portfolio?.holdings),
      createdAt: portfolio?.createdAt,
      upcomingDividend: 0,
    };
    return data;
  }

  async getPortfolioDashboard(profileId: string) {
    const portfolios = await this.prismaService.portfolio.findMany({
      where: { profileId: Number(profileId) },
      include: { holdings: { include: { stocks: true } } },
    });

    const sumary = portfolios.map(portfolio => this.getPortfolioSummary(portfolio));
    return sumary;
    // let profit = 0;
    // let pct = 0;
    // let dividendYield = 0; kknn

    // holdings?.forEach((holding) => {
    //   const _profit = holding.quantity * holding.stocks.currentPrice - holding.totalCost;
    //   profit += _profit;
    //   pct = holding.totalCost > 0 ? (profit / holding.totalCost) * 100 : 0;
    //   // dividendYield = holding.stocks.dividendYield
    // });
  }

  getPortfolioSummary(portfolio) {
    const portfolioCost = PortfolioCalculator.calculatePortfolioCost(portfolio);
    const portfolioNetworth = PortfolioCalculator.calculatePortfolioNetWorth(portfolio);
    const portfolioProfit = portfolioNetworth - portfolioCost;
    const profitPercent = PortfolioCalculator.calculateProfitPercent(portfolioProfit, portfolioCost);
    const annualDividendIncome = PortfolioCalculator.calculateAnnualDividend(portfolio);
    const dividendYield = PortfolioCalculator.calculatePortfolioDividendYield(portfolio);
    // const pl = PortfolioCalculator.calculateProfitLoss(portfolio);

    return {
      id: portfolio.id,
      name: portfolio.name,
      portfolioCost: portfolioCost,
      holdingsCount: portfolio.holdings.length,
      portfolioNetworth: portfolioNetworth,
      portfolioProfit: portfolioProfit,
      profitPercent: Number.isNaN(profitPercent) ? 0 : profitPercent,
      annualDividendIncome: annualDividendIncome,
      yield: dividendYield,
    };
  }

  private mapHoldings(holdings) {
    return holdings.map(h => {
      return {
        id: h.id,
        symbol: h.stocks.symbol,
        fullName: h.stocks.fullName,
        sector: h.stocks.sector.name,
        quantity: h.quantity,
        avgPrice: h.avgPrice,
        invested: Number(h.avgPrice) * Number(h.quantity),
        currentPrice: h.stocks.currentPrice,
        annualDividend: h.stocks.annualDividend,
        marketValue: Number(h.stocks.currentPrice) * Number(h.quantity),
        yield: (Number(h.stocks.annualDividend) / Number(h.stocks.currentPrice)) * 100,
        yoc: (Number(h.stocks.annualDividend) / Number(h.avgPrice)) * 100,
        pl: (Number(h.stocks.currentPrice) - Number(h.avgPrice)) * Number(h.quantity),
      };
    });
  }

  async getPortfolioByProfile(profileId: string): Promise<Portfolio[]> {
    const portfolios = await this.prismaService.portfolio.findMany({
      where: {
        profileId: Number(profileId),
      },
      include: {
        holdings: {
          include: {
            stocks: true,
          },
        },
      },
    });
    return portfolios;
  }

  create(body: CreatePortfolioDTO, profileId: string) {
    return this.prismaService.portfolio.create({
      data: {
        ...body,
        profile: { connect: { id: Number(profileId) } },
      },
    });
  }
}

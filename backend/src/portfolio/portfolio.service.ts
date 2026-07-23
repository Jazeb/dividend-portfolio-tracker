import { Injectable } from '@nestjs/common';
import { CreatePortfolioDTO } from './dto/createPortfolio.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Portfolio } from 'generated/prisma/client';
import { DividendService } from 'src/dividend/dividend.service';
import { PortfolioCalculator } from './calculators/portfolio-calculator';

@Injectable()
export class PortfolioService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly dividendService: DividendService,
  ) { }

  async getPortfolioById(portfolioId: string, profileId) {
    const portfolio = await this.prismaService.portfolio.findFirst({
      where: { id: Number(portfolioId), profileId: Number(profileId)  },
      include: { holdings: { include: { stocks: true } } },
    });
    const summary = this.getPortfolioSummary(portfolio);
    const data = {
      ...summary,
      description: portfolio?.description,
      strategy: portfolio?.strategy,
      holdings: portfolio?.holdings
    }
    return data
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
    }
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

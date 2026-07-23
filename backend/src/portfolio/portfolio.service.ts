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
  ) {}

  private calculateHoldingProfit() {}

  async getPortfolioDashboard(profileId: string) {
    const portfolios = await this.prismaService.portfolio.findMany({
      where: { profileId: Number(profileId) },
      include: { holdings: { include: { stocks: true } } },
    });

    const sumary = portfolios.map(portfolio => {
      const portfolioCost = PortfolioCalculator.calculatePortfolioCost(portfolio);
      const portfolioNetworth = PortfolioCalculator.calculatePortfolioNetWorth(portfolio);
      const portfolioProfit = portfolioNetworth - portfolioCost;
      const profitPercent = PortfolioCalculator.calculateProfitPercent(portfolioProfit, portfolioCost);
      const annualDividendIncome = PortfolioCalculator.calculateAnnualDividend(portfolio);
      const dividendYield = PortfolioCalculator.calculatePortfolioDividendYield(portfolio);
      return {
        id: portfolio.id,
        name: portfolio.name,
        portfolioCost: portfolioCost,
        holdingsCount: portfolio.holdings.length,
        portfolioNetworth: portfolioNetworth,
        portfolioProfit: portfolioProfit,
        profitPercent: profitPercent,
        annualDividendIncome: annualDividendIncome,
        yield: dividendYield,
      };
    });
    console.log(sumary);
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

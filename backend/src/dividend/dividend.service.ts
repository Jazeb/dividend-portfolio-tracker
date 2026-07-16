import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDividendDeclarationDto } from './dto/declaration.dto';
import {
  DividendDeclaration,
  DividendPayment,
  DividendPaymentStatus,
  Holding,
  Portfolio,
  Stock,
} from 'generated/prisma/client';

@Injectable()
export class DividendService {
  constructor(private readonly prismaService: PrismaService) {}

  TAX_RATE = 0.15;

  async createDeclaration(dto: CreateDividendDeclarationDto): Promise<DividendDeclaration> {
    const declaration = await this.prismaService.dividendDeclaration.create({ data: dto });

    const portfolios = await this.prismaService.portfolio.findMany({ include: { holdings: true } });

    portfolios.map(portfolio => {
      const holdings = portfolio.holdings;
      const eligibleHolding = holdings?.find(h => h.portfolioId === portfolio.id && h.stockId === declaration.stockId);
      if (!eligibleHolding) return;

      const dividendPerShare = Number(declaration.dividendPerShare);
      const taxAmount = dividendPerShare * this.TAX_RATE;
      const dividendPayment = {
        eligibleShares: eligibleHolding?.quantity,
        grossDividend: dividendPerShare * Number(eligibleHolding.quantity),
        taxAmount: taxAmount,
        netDividend: dividendPerShare * Number(eligibleHolding.quantity) - taxAmount,
        status: DividendPaymentStatus.UPCOMING,
      };

      this.prismaService.dividendPayment
        .create({
          data: {
            ...dividendPayment,
            profile: { connect: { id: eligibleHolding.profileId } },
            declaration: { connect: { id: declaration.id } },
            portfolio: { connect: { id: portfolio.id } },
            holding: { connect: { id: eligibleHolding.id } },
          },
        })
        .then(a => console.log(a))
        .catch(e => console.error(e));
    });

    return declaration;
  }

  async getDividendsHistory() {
    const history = await this.prismaService.dividendPayment.findMany({
      where: {
        // portfolioId:,
        status: 'UPCOMING',
      },
      include: {
        declaration: {
          include: {
            stock: true,
          },
        },
      },
    });
    const mapped = history.map(p => ({
      symbol: p.declaration.stock.symbol,
      fullName: p.declaration.stock.fullName,
      eligibleShares: p.eligibleShares,
      dividendPerShare: p.declaration.dividendPerShare,
      grossDividend: p.grossDividend,
      taxAmount: p.taxAmount,
      netDividend: p.netDividend,
      paymentDate: p.declaration.paymentDate,
      status: p.status,
      exDividendDate: p.declaration.exDividendDate,
    }));
    return mapped;
  }

  async getDashboardData(portfolioId: string, profileId: string) {
    const upcomingDividends = await this.getUpcomingDividends(portfolioId, profileId);
    const summary = await this.getSummaryData(portfolioId, profileId);
    return {
      upcoming: upcomingDividends,
      summary: summary,
      history: [],
      breakdownByStock: [],
      breakdownBySector: [],
      calendar: [],
      incomeTrend: [],
    };
  }

  private async getSummaryData(portfolioId: string, profileId: string) {
    const portfolio = await this.prismaService.portfolio.findFirst({
      where: { profileId: Number(profileId), id: Number(portfolioId) },
      include: { holdings: { include: { stocks: true } } },
    });
    const annualIncome = this.calculateAnnualIncome(portfolio?.holdings);
    const monthlyIncome = annualIncome / 12;
    const curentYield = this.calculateCurrentYield(portfolio?.holdings);
    const yoc = this.calculateYieldOnCost(portfolio?.holdings);
    return {
      annualIncome,
      monthlyIncome,
      lifetimeIncome: 0,
      upcomingDividend: 0,
      yield: curentYield,
      yieldOnCost: yoc,
    };
  }

  calculateMarketValueOfHoldings(holdings: any[]) {
    let marketValue = 0;
    for (const holding of holdings) {
      const stock = holding?.stocks as Stock;
      marketValue += Number(stock.currentPrice) * holding.quantity;
    }
    return marketValue;
  }

  calculatePortfolioCost(holdings: Holding[]) {
    let pc = 0;
    for (const holding of holdings) pc += Number(holding.totalCost);
    return pc;
  }

  calculateYieldOnCost(holdings: any) {
    const projectedAnnualDividendIncome = this.calculateAnnualIncome(holdings);
    const totalPortfolioCost = this.calculatePortfolioCost(holdings);
    const yoc = (projectedAnnualDividendIncome / totalPortfolioCost) * 100;
    return yoc;
  }

  calculateAnnualIncome(holdings: any) {
    let annualIncome = 0;
    for (const holding of holdings) annualIncome += holding.quantity * holding.stocks.annualDividend;
    return annualIncome;
  }

  calculateCurrentYield(holdings: any) {
    const currentPortfolioMarketValue = this.calculateMarketValueOfHoldings(holdings);
    const projectedAnnualDividendIncome = this.calculateAnnualIncome(holdings);
    const currentYield = (projectedAnnualDividendIncome / currentPortfolioMarketValue) * 100;
    return currentYield;
  }

  async getUpcomingDividends(portfolioId: string, profileId: string) {
    const upcoming = await this.prismaService.dividendPayment.findMany({
      where: {
        portfolioId: Number(portfolioId),
        profileId: Number(profileId),
        status: 'UPCOMING',
      },
      include: { declaration: { include: { stock: true } } },
      orderBy: { declaration: { paymentDate: 'asc' } },
    });

    return upcoming.map(payment => {
      const d = payment.declaration;

      const grossDividend = Number(payment.eligibleShares) * Number(d.dividendPerShare);

      const taxAmount = grossDividend * this.TAX_RATE;

      const netDividend = grossDividend - taxAmount;

      return {
        id: payment.id,
        stock: d.stock.symbol,
        company: d.stock.fullName,

        eligibleShares: Number(payment.eligibleShares),
        dividendPerShare: Number(d.dividendPerShare),

        grossDividend,
        taxRate: Number(payment.taxRate),
        taxAmount,
        netDividend,

        exDividendDate: d.exDividendDate,
        bookClosureDate: d.bookClosureDate,
        paymentDate: d.paymentDate,

        status: payment.status,
      };
    });
  }

  // async getUpcomingDividends(): Promise<any[]> {
  //   const upcoming = await this.prismaService.dividendPayment.findMany({
  //     where: {
  //       // portfolioId:,
  //       status: 'UPCOMING',
  //     },
  //     include: {
  //       declaration: {
  //         include: {
  //           stock: true,
  //         },
  //       },
  //     },
  //   });

  //   const mapped = upcoming.map(p => ({
  //     symbol: p.declaration.stock.symbol,
  //     fullName: p.declaration.stock.fullName,
  //     eligibleShares: p.eligibleShares,
  //     dividendPerShare: p.declaration.dividendPerShare,
  //     grossDividend: p.grossDividend,
  //     taxAmount: p.taxAmount,
  //     netDividend: p.netDividend,
  //     paymentDate: p.declaration.paymentDate,
  //     status: p.status,
  //     exDividendDate: p.declaration.exDividendDate,
  //   }));
  //   return mapped;
  // }
}

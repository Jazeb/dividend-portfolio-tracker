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
    // const upcomingDividends = await this.getUpcomingDividends(portfolioId, profileId);
    const dividendPayments = await this.getDividendPayments(portfolioId, profileId);

    const portfolio = await this.prismaService.portfolio.findFirst({
      where: { profileId: Number(profileId), id: Number(portfolioId) },
      include: { holdings: { include: { stocks: { include: { sector: true } } } } },
    });

    if (!portfolio) return [];

    const upcommingDividends = this._getUpcomingDividends(dividendPayments);
    const dividendHistory = this.getDividendHistory(dividendPayments);

    const summary = this.getSummaryData(portfolio);
    summary.upcomingDividend = this.calculatecommulativeUpcomingDividend(upcommingDividends);
    const monthlyDividends = await this.getMonthlyDividends(portfolio.id);

    const breakdownByStocks = this.calculateBreakdownByStock(portfolio);
    const breakdownBySector = this.calculateBrealdownBySector(portfolio);

    return {
      upcoming: upcommingDividends,
      summary: summary,
      history: dividendHistory,
      breakdownByStock: breakdownByStocks,
      breakdownBySector: breakdownBySector,
      monthlyDividends,
      calendar: [],
      incomeTrend: [],
    };
  }

  async getDividendPayments(portfolioId: string, profileId: string): Promise<DividendPayment[]> {
    const diviendPayments = await this.prismaService.dividendPayment.findMany({
      where: {
        portfolioId: Number(portfolioId),
        profileId: Number(profileId),
        // status: 'UPCOMING',
      },
      include: { declaration: { include: { stock: true } } },
      orderBy: { declaration: { paymentDate: 'asc' } },
    });
    return diviendPayments;
  }

  private calculateBrealdownBySector(portfolio) {
    const sectorMap = new Map<string, number>();

    for (const holding of portfolio.holdings) {
      const sector = holding.stocks.sector;
      const annualIncome = holding.quantity * holding.stocks.annualDividend;
      let key = sector.name;
      sectorMap.set(key, (sectorMap.get(sector) ?? 0) + annualIncome);
    }

    const breakdownBySector = Array.from(sectorMap, ([sector, annualIncome]) => ({
      sector: sector,
      annualIncome,
    }));
    return breakdownBySector;
  }

  public getSummaryData(_portfolio) {
    const annualIncome = this.calculateAnnualIncome(_portfolio?.holdings);
    const monthlyIncome = annualIncome / 12;
    const curentYield = this.calculateCurrentYield(_portfolio?.holdings);
    const yoc = this.calculateYieldOnCost(_portfolio?.holdings);
    return {
      annualIncome,
      monthlyIncome,
      lifetimeIncome: 0,
      upcomingDividend: 0,
      yield: curentYield.toFixed(2),
      yieldOnCost: yoc.toFixed(2),
    };
  }

  calculatecommulativeUpcomingDividend(upcomingDividends: any) {
    return upcomingDividends.reduce((a, c) => a + c.grossDividend, 0);
  }

  calculateBreakdownByStock(portfolio) {
    const holdings = portfolio.holdings;
    const totalAnnualIncome = holdings.reduce(
      (sum, holding) => sum + holding.quantity * holding.stocks.annualDividend,
      0,
    );
    return holdings.map(holding => {
      const annualIncome = holding.quantity * holding.stocks.annualDividend;
      const currentYield = holding.stocks.annualDividend / holding.stocks.currentPrice;
      const yoc = holding.stocks.annualDividend / holding.avgPrice;
      return {
        symbol: holding.stocks.symbol,
        company: holding.stocks.fullName,
        annualIncome: annualIncome,
        yield: (currentYield * 100).toFixed(2),
        yieldOnCost: (yoc * 100).toFixed(2),
        contribution: ((annualIncome / totalAnnualIncome) * 100).toFixed(1),
      };
    });
  }

  calculateMarketValueOfHoldings(holdings: any[]) {
    let marketValue = 0;
    for (const holding of holdings) {
      const stock = holding?.stocks as Stock;
      marketValue += Number(stock?.currentPrice || 0) * holding.quantity;
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
    for (const holding of holdings) annualIncome += holding.quantity * (holding.stocks?.annualDividend || 0);
    return annualIncome;
  }

  calculateCurrentYield(holdings: any) {
    const currentPortfolioMarketValue = this.calculateMarketValueOfHoldings(holdings);
    const projectedAnnualDividendIncome = this.calculateAnnualIncome(holdings);
    const currentYield = (projectedAnnualDividendIncome / currentPortfolioMarketValue) * 100;
    return Number.isNaN(currentYield) ? 0 : currentYield;
  }

  private _getUpcomingDividends(upcoming) {
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

  getDividendHistory(upcoming) {
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

  async getUpcomingDividends(portfolioId?: string) {
    return this.prismaService.dividendDeclaration.findMany();
  }

  async getMonthlyDividends(portfolioId: number) {
    const year = new Date().getFullYear();

    const startOfYear = new Date(year, 0, 1); // 2026-01-01
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999); // 2026-12-31

    const result = await this.prismaService.$queryRaw<{ month: number; gross: number }[]>`
      SELECT
          m.month,
          COALESCE(SUM(h.quantity * dd."dividendPerShare"), 0) AS gross
      FROM generate_series(1, 12) AS m(month)
      LEFT JOIN "DividendDeclaration" dd
          ON EXTRACT(MONTH FROM dd."paymentDate") = m.month
          AND dd."paymentDate" BETWEEN ${startOfYear} AND ${endOfYear}
      LEFT JOIN "Holding" h
          ON h."stockId" = dd."stockId"
          AND h."portfolioId" = ${portfolioId}
      GROUP BY m.month
      ORDER BY m.month;
    `;

    return result;
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

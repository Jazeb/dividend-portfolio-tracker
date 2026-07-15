import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDividendDeclarationDto } from './dto/declaration.dto';
import { DividendDeclaration, DividendPayment, DividendPaymentStatus } from 'generated/prisma/client';

@Injectable()
export class DividendService {
  constructor(private readonly prismaService: PrismaService) {}
  async createDeclaration(dto: CreateDividendDeclarationDto): Promise<DividendDeclaration> {
    const TAX_RATE = 0.15;

    const declaration = await this.prismaService.dividendDeclaration.create({ data: dto });

    const portfolios = await this.prismaService.portfolio.findMany({ include: { holdings: true } });

    portfolios.map(portfolio => {
      const holdings = portfolio.holdings;
      const eligibleHolding = holdings?.find(h => h.portfolioId === portfolio.id && h.stockId === declaration.stockId);
      if (!eligibleHolding) return;

      const dividendPerShare = Number(declaration.dividendPerShare);
      const taxAmount = dividendPerShare * TAX_RATE;
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

  async getUpcomingDividends(): Promise<any[]> {
    const upcoming = await this.prismaService.dividendPayment.findMany({
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

    const mapped = upcoming.map(p => ({
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
}

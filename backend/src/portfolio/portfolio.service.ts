import { Injectable } from '@nestjs/common';
import { CreatePortfolioDTO } from './dto/createPortfolio.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Portfolio } from 'generated/prisma/client';
import { DividendService } from 'src/dividend/dividend.service';

@Injectable()
export class PortfolioService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly dividendService: DividendService,
  ) {}

  async getPortfolioDashboard(profileId: string) {
    const portfolios = await this.prismaService.portfolio.findMany({
      where: { profileId: Number(profileId) },
      include: { holdings: { include: { stocks: true } } },
    });

    return portfolios.map(portfolio => {
      const summary = this.dividendService.getSummaryData(portfolio);
      return {
        id: portfolio.id,
        name: portfolio.name,
        strategy: portfolio.strategy,
        description: portfolio.description,
        holdings: portfolio.holdings,
        ...summary,
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

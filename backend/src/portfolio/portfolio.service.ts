import { Injectable } from '@nestjs/common';
import { CreatePortfolioDTO } from './dto/createPortfolio.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Portfolio } from 'generated/prisma/client';

@Injectable()
export class PortfolioService {
  constructor(private readonly prismaService: PrismaService) {}

  async getPortfolioByProfile(profileId: string): Promise<Portfolio[]> {
    const portfolio = await this.prismaService.portfolio.findMany({
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
    // const totalCost = portfolio[0].holdings.reduce((acc, current) => acc + Number(current.totalCost), 0);
    return portfolio;
  }

  create(body: CreatePortfolioDTO, profileId: string) {
    return this.prismaService.portfolio.create({
      data: {
        ...body,
        profile: {
          connect: {
            id: Number(profileId),
          },
        },
      },
    });
  }
}

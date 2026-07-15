import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDividendDeclarationDto } from './dto/declaration.dto';
import { DividendDeclaration } from 'generated/prisma/client';

@Injectable()
export class DividendService {
  constructor(private readonly prismaService: PrismaService) { }
  async createDeclaration(dto: CreateDividendDeclarationDto): Promise<DividendDeclaration> {
    const declaration = await this.prismaService.dividendDeclaration.create({
      data: dto,
    });

    const holdings = await this.prismaService.holding.findMany({ where: { stockId: declaration.stockId } })
    holdings.map(holding => {
      return {
        eligibleShares: holding.quantity,
        grossDividend: declaration.dividendPerShare,
        taxRate: 15,
        // taxAmount: 

      }
    })

    const dividendPayment = {
      eligibleShares: 0
    }
    return declaration;
  }

  async getUpcomingDividends(): Promise<DividendDeclaration[]> {
    const declaration = await this.prismaService.dividendDeclaration.findMany({
      include: {
        stock: true
      }
    });
    return declaration
  }
}

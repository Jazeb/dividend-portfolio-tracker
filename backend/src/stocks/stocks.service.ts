import { Injectable, Param } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Sector, Stock } from 'generated/prisma/client';

@Injectable()
export class StocksService {
    constructor(private readonly prisma: PrismaService) {}
    async getStocks(): Promise<Stock[]> {
        return await this.prisma.stock.findMany();
    }

    async getStockById(@Param('id') id: string): Promise<Stock> {
        return await this.prisma.stock.findUniqueOrThrow({
            where: { id: parseInt(id) },
        });
    }

    async getSectors(): Promise<Sector[]> {
        return await this.prisma.sector.findMany();
    }
}

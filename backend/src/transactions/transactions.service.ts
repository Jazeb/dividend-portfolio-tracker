import { Injectable, Param, Body } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Transaction, TransactionType } from 'generated/prisma/client';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { connect } from 'http2';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTransactions(): Promise<Transaction[]> {
    return await this.prisma.transaction.findMany();
  }

  async getTransactionsByProfileId(profileId: number): Promise<Transaction[]> {
    return await this.prisma.transaction.findMany({
      where: { profileId },
      include: { stock: { select: { symbol: true, fullName: true } } },
    });
  }

  async getTransactionById(@Param('id') id: string): Promise<Transaction> {
    return await this.prisma.transaction.findUniqueOrThrow({
      where: { id: parseInt(id) },
    });
  }

  async createTransaction(@Body() body: CreateTransactionDto, profileId: string): Promise<Transaction> {
    const stock = await this.prisma.stock.findFirst({ where: { symbol: body.symbol } });
    if (!stock) throw new Error('invalid stock symbol');

    const transaction = await this.prisma.transaction.create({
      data: {
        stockId: stock.id,
        quantity: body.quantity,
        buyingPrice: body.buyingPrice,
        totalBuyingPrice: body.buyingPrice * body.quantity,
        transactionType: body.transactionType.toUpperCase() as TransactionType,
        purchaseDate: new Date(body.purchaseDate),
        portfolioId: parseInt(body.portfolioId),
        profileId: parseInt(profileId),
        broker: body.broker,
      },
    });
    console.log(transaction);
    return transaction;
  }
}

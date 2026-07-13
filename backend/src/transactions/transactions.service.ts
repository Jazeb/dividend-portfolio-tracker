import { Injectable, Param, Body } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Holding, Transaction, TransactionType } from 'generated/prisma/client';
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
      where: { id },
    });
  }

  private async updateCurrentHolding(currentHolding: Holding, transaction: Transaction) {
    const newQuantity = Number(currentHolding.quantity) + Number(transaction.quantity);
    const newAvgPrice = (Number(currentHolding.totalCost) + Number(transaction.totalBuyingPrice)) / newQuantity;
    const newTotalCost = Number(currentHolding.totalCost) + Number(transaction.totalBuyingPrice);
    
    await this.prisma.holding.update({
      where: {
        portfolioId_stockId: {
          portfolioId: currentHolding.portfolioId,
          stockId: currentHolding.stockId,
        },
      },
      data: {
        quantity: newQuantity,
        avgPrice: newAvgPrice,
        totalCost: newTotalCost,
      },
    });
  }

  private async addNewHolding(transaction: Transaction) {
    await this.prisma.holding.create({
      data: {
        quantity: transaction.quantity,
        avgPrice: transaction.buyingPrice,
        totalCost: transaction.totalBuyingPrice,
        stockId: transaction.stockId,
        portfolioId: transaction.portfolioId,
      },
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

    const currentHolding = await this.prisma.holding.findFirst({
      where: {
        portfolioId: parseInt(body.portfolioId),
        stockId: stock.id,
      },
    });

    if(currentHolding) {
      await this.updateCurrentHolding(currentHolding, transaction);
    } else {
      await this.addNewHolding(transaction);
    }


    // this.prisma.holding.upsert({
    //   where: {
    //     portfolioId_stockId: {
    //       portfolioId: parseInt(body.portfolioId),
    //       stockId: stock.id,
    //     },
    //   },
    //   update: {
    //     quantity: transaction.quantity,
    //     avgPrice: transaction.buyingPrice,
    //     totalCost: transaction.totalBuyingPrice,
    //   },
    //   create: {
    //     quantity: transaction.quantity,
    //     avgPrice: transaction.buyingPrice,
    //     totalCost: transaction.totalBuyingPrice,
    //     stockId: stock.id,
    //     portfolioId: parseInt(body.portfolioId),
    //   },
    // });
    return transaction;
  }
}

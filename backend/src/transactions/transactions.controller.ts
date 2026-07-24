import { Body, Controller, Get, Param, Post, Headers, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { Transaction } from 'generated/prisma/client';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get('')
  getTransactions(): Promise<Transaction[]> {
    return this.transactionsService.getTransactions();
  }

  @Get('profile')
  getTransactionsByProfileId(@Headers('UserId') userId: string, @Query('portfolioId') portfolioId: string): Promise<Transaction[]> {
    const profileId = Number(userId);
    return this.transactionsService.getTransactionsByProfileId(profileId, portfolioId);
  }

  @Get(':id')
  getTransactionById(@Param('id') id: string): Promise<Transaction> {
    return this.transactionsService.getTransactionById(id);
  }

  @Post('')
  createTransaction(@Headers('UserId') userId: string, @Body() body: CreateTransactionDto): Promise<Transaction> {
    return this.transactionsService.createTransaction(body, userId);
  }
}

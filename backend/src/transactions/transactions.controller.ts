import { Body, Controller, Get, Param, Post, Headers } from '@nestjs/common';
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
  getTransactionsByProfileId(@Headers('UserId') userId: string): Promise<Transaction[]> {
    const profileId = Number(userId);
    return this.transactionsService.getTransactionsByProfileId(profileId);
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

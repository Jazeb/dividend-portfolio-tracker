import { IsDate, IsNotEmpty, IsNumber, IsString, IsEnum } from 'class-validator';
import { TransactionType } from 'generated/prisma/client';

export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  symbol: string;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsNumber()
  @IsNotEmpty()
  buyingPrice: number;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsDate()
  @IsNotEmpty()
  purchaseDate: string;

  @IsString()
  @IsNotEmpty()
  portfolioId: string;

  @IsString()
  @IsNotEmpty()
  profileId: string;

  @IsEnum(TransactionType)
  @IsNotEmpty()
  transactionType: TransactionType;

  @IsString()
  broker: string;
}

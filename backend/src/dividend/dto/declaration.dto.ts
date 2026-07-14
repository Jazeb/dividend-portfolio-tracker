import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { DividendQuarter, DividendStatus } from 'generated/prisma/enums';

export class CreateDividendDeclarationDto {
  @IsNumber()
  stockId: number;

  @IsNumber()
  @Min(0)
  dividendPerShare: number;

  @IsOptional()
  @IsDateString()
  announcementDate?: string;

  @IsDateString()
  exDividendDate: string;

  @IsDateString()
  bookClosureDate: string;

  @IsDateString()
  paymentDate: string;

  @IsOptional()
  @IsInt()
  financialYear?: number;

  @IsOptional()
  @IsEnum(DividendQuarter)
  quarter?: DividendQuarter;

  @IsOptional()
  @IsEnum(DividendStatus)
  status?: DividendStatus;
}

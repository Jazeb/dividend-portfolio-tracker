import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProfileModule } from './profile/profile.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { TransactionsModule } from './transactions/transactions.module';
import { PrismaModule } from './prisma/prisma.module';
import { StocksModule } from './stocks/stocks.module';
import { HoldingModule } from './holding/holding.module';

@Module({
  imports: [PrismaModule, ProfileModule, PortfolioModule, TransactionsModule, StocksModule, HoldingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

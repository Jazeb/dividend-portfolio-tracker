import { Module } from '@nestjs/common';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { DividendService } from 'src/dividend/dividend.service';

@Module({
  controllers: [PortfolioController],
  providers: [PortfolioService, DividendService],
})
export class PortfolioModule {}

import { Module } from '@nestjs/common';
import { DividendController } from './dividend.controller';
import { DividendService } from './dividend.service';

@Module({
  controllers: [DividendController],
  providers: [DividendService],
})
export class DividendModule {}

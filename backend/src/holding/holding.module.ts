import { Module } from '@nestjs/common';
import { HoldingService } from './holding.service';
import { HoldingController } from './holding.controller';

@Module({
  controllers:[HoldingController],
  providers: [HoldingService]
})
export class HoldingModule {}

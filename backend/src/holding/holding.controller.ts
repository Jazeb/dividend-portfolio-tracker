import { Controller, Get, Headers, Query } from '@nestjs/common';
import { HoldingService } from './holding.service';
import { Holding } from 'generated/prisma/client';

@Controller('holding')
export class HoldingController {
  constructor(private readonly holdingService: HoldingService) {}

  @Get('/dashboard')
  getHoldingsDashboard(@Headers('UserId') userId: string, @Query() query: { portfolioId: string }) {
    return this.holdingService.getHoldingDashboard(userId, query);
  }

  @Get('/byProfile')
  getHoldingsByProfile(@Headers('UserId') userId: string): Promise<Holding[]> {
    return this.holdingService.getHoldingsByProfile(userId);
  }
}

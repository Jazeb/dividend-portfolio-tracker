import { Controller, Get, Post, Body, Headers, Query } from '@nestjs/common';
import { DividendDeclaration } from 'generated/prisma/client';
import { DividendService } from './dividend.service';
import { CreateDividendDeclarationDto } from './dto/declaration.dto';

@Controller('dividends')
export class DividendController {
  constructor(private readonly dividendService: DividendService) {}

  //   @Get('/byProfile')
  //   getPortfoliosByProfile(@Headers('UserId') userId: string): Promise<DividendDeclaration[]> {
  //     // return this.portfolioService.getPortfolioByProfile(userId);
  //   }

  @Get('/dashboard')
  getDashboard(@Query() query: { portfolioId: string }, @Headers('UserId') userId: string) {
    return this.dividendService.getDashboardData(query.portfolioId, userId);
  }

  @Get('/upcoming')
  getUpcomingDividends(@Query() query: { portfolioId: string }, @Headers('UserId') userId: string) {
    return this.dividendService.getUpcomingDividends(query.portfolioId, userId);
  }

  @Get('/history')
  getDividendsHistory() {
    return this.dividendService.getDividendsHistory();
  }

  @Post('declaration')
  createDividendDeclaration(@Body() body: CreateDividendDeclarationDto): Promise<DividendDeclaration> {
    return this.dividendService.createDeclaration(body);
  }
}

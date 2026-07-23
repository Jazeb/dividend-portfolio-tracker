import { Body, Controller, Get, Post, Headers, Param } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { CreatePortfolioDTO } from './dto/createPortfolio.dto';
import { Portfolio } from 'generated/prisma/client';

@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  

  @Get('/byProfile')
  getPortfoliosByProfile(@Headers('UserId') userId: string): Promise<Portfolio[]> {
    return this.portfolioService.getPortfolioByProfile(userId);
  }

  @Get('/dashboard')
  getPortfolioDashboard(@Headers('UserId') userId: string) {
    return this.portfolioService.getPortfolioDashboard(userId);
  }

  @Post('')
  createPortfolio(@Headers('UserId') userId: string, @Body() body: CreatePortfolioDTO): Promise<Portfolio> {
    return this.portfolioService.create(body, userId);
  }

  @Get(':id')
  getPortfolioById(
    @Param('id') portfolioId: string, 
    @Headers('UserId') userId: string
  ) {
    console.log({portfolioId, userId})
    return this.portfolioService.getPortfolioById(portfolioId, userId);
  }
}

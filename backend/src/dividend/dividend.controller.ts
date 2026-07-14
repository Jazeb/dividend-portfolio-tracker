import { Controller, Get, Post, Body, Headers } from '@nestjs/common';
import { DividendDeclaration } from 'generated/prisma/client';
import { DividendService } from './dividend.service';
import { CreateDividendDeclarationDto } from './dto/declaration.dto';

@Controller('dividend')
export class DividendController {
  constructor(private readonly dividendService: DividendService) {}

  //   @Get('/byProfile')
  //   getPortfoliosByProfile(@Headers('UserId') userId: string): Promise<DividendDeclaration[]> {
  //     // return this.portfolioService.getPortfolioByProfile(userId);
  //   }

  @Post('declaration')
  createDividendDeclaration(@Body() body: CreateDividendDeclarationDto): Promise<DividendDeclaration> {
    return this.dividendService.createDeclaration(body);
  }
}

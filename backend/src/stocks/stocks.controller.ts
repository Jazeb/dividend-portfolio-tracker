import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Sector, Stock } from 'generated/prisma/client';
import { StocksService } from './stocks.service';

@Controller('stocks')
export class StocksController {
    constructor(private readonly stocksService: StocksService) {}
    @Get('')
    getStocks(): Promise<Stock[]> {
        return this.stocksService.getStocks();
    }

    @Get('/sectors')
    getSectors(): Promise<Sector[]> {
        return this.stocksService.getSectors();
    }
    
    @Get(':id')
    getStockById(@Param('id') id: string): Promise<Stock> {
        return this.stocksService.getStockById(id);
    }

    // @Post('')
    // createStock(@Body() body: CreateStockDto): Promise<CreateStockDto> {
    //     return this.stocksService.createStock(body);
    // }
}

import { Controller, Get, Headers } from '@nestjs/common';
import { HoldingService } from './holding.service';
import { Holding } from 'generated/prisma/client';

@Controller('holding')
export class HoldingController {
    constructor(private readonly holdingService: HoldingService) { }

    @Get('/byProfile')
    getHoldingsByProfile(@Headers('UserId') userId: string): Promise<Holding[]> {
        return this.holdingService.getHoldingsByProfile(userId);
    }

}

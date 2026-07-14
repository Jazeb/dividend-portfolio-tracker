import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class HoldingService {
    constructor(private readonly prismaService: PrismaService) { }
    
    getHoldingsByProfile(userId: string) {
        return this.prismaService.holding.findMany({
            where: { profileId: parseInt(userId) },
            include: {
                stocks:{
                    include:{sector: true}
                }
            }
        })
    }
}

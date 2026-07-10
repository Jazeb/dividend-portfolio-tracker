import { IsString, IsNotEmpty } from "class-validator";
import { PortfolioStrategy } from 'generated/prisma/client';

export class CreatePortfolioDTO {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    strategy: PortfolioStrategy;

    @IsString()
    @IsNotEmpty()
    description: string;
    
    // @IsString()
    // currentWorth: number;
}
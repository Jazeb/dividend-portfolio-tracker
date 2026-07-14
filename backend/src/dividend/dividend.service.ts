import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDividendDeclarationDto } from './dto/declaration.dto';
import { DividendDeclaration } from 'generated/prisma/client';

@Injectable()
export class DividendService {
  constructor(private readonly prismaService: PrismaService) {}
  async createDeclaration(dto: CreateDividendDeclarationDto): Promise<DividendDeclaration> {
    return this.prismaService.dividendDeclaration.create({
      data: dto,
    });
  }
}

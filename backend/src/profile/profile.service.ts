import { Injectable } from '@nestjs/common';

import { CreateProfileDto } from './dto/create-profile.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Profile } from 'generated/prisma/client';

@Injectable()
export class ProfileService {
    constructor(private readonly prisma: PrismaService) {}
    async createProfile(body: CreateProfileDto): Promise<CreateProfileDto> {
        return await this.prisma.profile.create({
            data: body,
        });
    }
    async getProfile(): Promise<Profile[]> {
        return await this.prisma.profile.findMany();
    }
}

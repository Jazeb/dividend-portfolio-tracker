import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateProfileDto } from './dto/create-profile.dto';
import { ProfileService } from './profile.service';
import { Profile } from 'generated/prisma/client';

@Controller('profile')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) {}
  @Get('')
  getProfile(): Promise<Profile[]> {
    return this.profileService.getProfile();
  }

  @Post('')
  createProfile(@Body() body: CreateProfileDto): Promise<CreateProfileDto> {
    return this.profileService.createProfile(body);
  }
}

import { IsString, IsNotEmpty, IsEmail, IsPhoneNumber, IsDate } from 'class-validator';

export class CreateProfileDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  //   @IsString()
  //   @IsNotEmpty()
  //   @IsPhoneNumber()
  //   phone: string;

  //   @IsString()
  //   @IsNotEmpty()
  //   @IsDate()
  //   dateOfBirth: Date;
}

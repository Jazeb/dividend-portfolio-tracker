import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsPhoneNumber,
  IsDate,
} from 'class-validator';

export class CreateProfileDto {

  @IsString()
  @IsNotEmpty()
  name: string;

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
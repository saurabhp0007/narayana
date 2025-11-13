import { IsString, IsEmail, IsNotEmpty, MinLength, IsOptional, IsPhoneNumber } from 'class-validator';

export class RegisterUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsPhoneNumber('IN')
  phone?: string;
}

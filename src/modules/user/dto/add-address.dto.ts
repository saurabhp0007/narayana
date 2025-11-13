import { IsString, IsNotEmpty, IsOptional, IsBoolean, Matches } from 'class-validator';

export class AddAddressDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{10}$/, { message: 'Phone must be a valid 10-digit number' })
  phone: string;

  @IsString()
  @IsNotEmpty()
  addressLine1: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{6}$/, { message: 'Pincode must be a valid 6-digit number' })
  pincode: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

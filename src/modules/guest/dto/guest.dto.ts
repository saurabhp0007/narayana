import { IsNotEmpty, IsString, IsNumber, Min, IsOptional, ValidateNested, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GuestAddToCartDto {
  @ApiProperty({ description: 'Guest session ID' })
  @IsString()
  @IsNotEmpty()
  guestId: string;

  @ApiProperty({ description: 'Product ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Quantity', default: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @ApiProperty({ description: 'Selected size, required when the product has sizes', required: false })
  @IsString()
  @IsOptional()
  size?: string;
}

export class GuestUpdateCartDto {
  @ApiProperty({ description: 'Guest session ID' })
  @IsString()
  @IsNotEmpty()
  guestId: string;

  @ApiProperty({ description: 'Product ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'New quantity' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Size of the cart line being updated', required: false })
  @IsString()
  @IsOptional()
  size?: string;
}

export class GuestRemoveFromCartDto {
  @ApiProperty({ description: 'Guest session ID' })
  @IsString()
  @IsNotEmpty()
  guestId: string;

  @ApiProperty({ description: 'Product ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Size of the cart line being removed', required: false })
  @IsString()
  @IsOptional()
  size?: string;
}

export class GuestCartQueryDto {
  @ApiProperty({ description: 'Guest session ID' })
  @IsString()
  @IsNotEmpty()
  guestId: string;
}

export class GuestAddToWishlistDto {
  @ApiProperty({ description: 'Guest session ID' })
  @IsString()
  @IsNotEmpty()
  guestId: string;

  @ApiProperty({ description: 'Product ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;
}

export class CustomerDetailsDto {
  @ApiProperty({ description: 'Full name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Email address' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Phone number' })
  @IsString()
  @IsNotEmpty()
  phone: string;
}

export class ShippingAddressDto {
  @ApiProperty({ description: 'Street address' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ description: 'City' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ description: 'State' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ description: 'PIN code' })
  @IsString()
  @IsNotEmpty()
  pincode: string;
}

export class GuestCheckoutDto {
  @ApiProperty({ description: 'Guest session ID' })
  @IsString()
  @IsNotEmpty()
  guestId: string;

  @ApiProperty({ description: 'Customer details' })
  @IsObject()
  @ValidateNested()
  @Type(() => CustomerDetailsDto)
  customerDetails: CustomerDetailsDto;

  @ApiProperty({ description: 'Shipping address' })
  @IsObject()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiProperty({ description: 'Order notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class MergeCartDto {
  @ApiProperty({ description: 'Guest session ID to merge from' })
  @IsString()
  @IsNotEmpty()
  guestId: string;
}

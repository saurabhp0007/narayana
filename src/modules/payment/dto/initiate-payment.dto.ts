import { IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CustomerDetailsDto, ShippingAddressDto } from '../../guest/dto/guest.dto';

export class InitiatePaymentDto {
  @ApiPropertyOptional({ description: 'Guest session ID. Required when the caller is not logged in.' })
  @IsString()
  @IsOptional()
  guestId?: string;

  @ApiPropertyOptional({
    description: 'Customer details. Required for guests; optional for logged-in users.',
  })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => CustomerDetailsDto)
  customerDetails?: CustomerDetailsDto;

  @ApiProperty({ description: 'Shipping address' })
  @IsObject()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiPropertyOptional({ description: 'Order notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

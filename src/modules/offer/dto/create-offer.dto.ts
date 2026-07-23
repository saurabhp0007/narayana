import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray, IsMongoId, IsNumber, IsBoolean, IsDateString, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OfferType } from '../schemas/offer.schema';

class OfferRuleDto {
  @ApiPropertyOptional({
    description: 'Number of items to buy for BOGO offers',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  buyQuantity?: number;

  @ApiPropertyOptional({
    description: 'Number of free items for BOGO offers',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  getQuantity?: number;

  @ApiPropertyOptional({
    description: 'Fixed bundle price for bundle offers',
    example: 99.99,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bundlePrice?: number;

  @ApiPropertyOptional({
    description: 'Discount percentage (0-100)',
    example: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage?: number;

  @ApiPropertyOptional({
    description: 'Fixed discount amount',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({
    description: 'Minimum quantity required for the offer',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minQuantity?: number;
}

export class CreateOfferDto {
  @ApiProperty({
    description: 'Name of the offer',
    example: 'Summer Sale',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the offer',
    example: 'Get 20% off on all summer collection',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Type of the offer',
    example: 'percentageOff',
    enum: ['buyXGetY', 'bundle', 'percentageOff', 'fixedAmount'],
  })
  @IsEnum(OfferType)
  offerType: OfferType;

  @ApiProperty({
    description: 'Rules configuration for the offer',
    example: { discountPercentage: 20, minQuantity: 1 },
    type: OfferRuleDto,
  })
  @ValidateNested()
  @Type(() => OfferRuleDto)
  rules: OfferRuleDto;

  @ApiPropertyOptional({
    description: 'Array of product IDs this offer applies to',
    example: [],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  productIds?: string[];

  @ApiPropertyOptional({
    description: 'Array of category IDs this offer applies to',
    example: ['507f1f77bcf86cd799439012'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  categoryIds?: string[];

  @ApiPropertyOptional({
    description: 'Array of gender IDs this offer applies to',
    example: [],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  genderIds?: string[];

  @ApiProperty({
    description: 'Start date of the offer (ISO 8601 format)',
    example: '2024-06-01T00:00:00Z',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date of the offer (ISO 8601 format)',
    example: '2024-08-31T23:59:59Z',
  })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({
    description: 'Whether the offer is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Priority of the offer (higher number = higher priority)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  priority?: number;

  @ApiPropertyOptional({
    description: 'Whether to display this offer in navbar dropdown',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  displayInNavbar?: boolean;
}

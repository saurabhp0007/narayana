import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray, IsMongoId, IsNumber, IsBoolean, IsDateString, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { OfferType } from '../schemas/offer.schema';

class OfferRuleDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  buyQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  getQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bundlePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  minQuantity?: number;
}

export class CreateOfferDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(OfferType)
  offerType: OfferType;

  @ValidateNested()
  @Type(() => OfferRuleDto)
  rules: OfferRuleDto;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  productIds?: string[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  subcategoryIds?: string[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  genderIds?: string[];

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  priority?: number;
}

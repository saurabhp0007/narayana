import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsArray, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCollectionDto {
  @ApiProperty({ description: 'Collection name shown as the admin/homepage label', example: 'Bestselling Bags' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'URL-friendly slug, auto-generated from name if omitted', example: 'bestselling-bags' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ description: 'ImageKit URL for the banner image shown above the product strip' })
  @IsOptional()
  @IsString()
  bannerImage?: string;

  @ApiPropertyOptional({ description: 'Ordered list of product IDs to feature in this collection', type: [String] })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  productIds?: string[];

  @ApiPropertyOptional({ description: 'Sort order among collections (lower shows first)', example: 0 })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'Whether this collection is shown on the homepage', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

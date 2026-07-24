import { IsString, IsOptional, IsBoolean, IsNumber, MinLength, MaxLength, IsMongoId } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCategoryDto {
  @ApiPropertyOptional({
    description: 'Name of the category',
    example: 'Footwear',
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name?: string;

  @ApiPropertyOptional({
    description: 'URL-friendly slug for the category',
    example: 'footwear',
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({
    description: 'MongoDB ID of the associated gender',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId({ message: 'Invalid gender ID' })
  genderId?: string;

  @ApiPropertyOptional({
    description: 'Whether this category is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Groups this category into a homepage tab section, e.g. "footwear" or "shop-by-category"',
    example: 'footwear',
  })
  @IsOptional()
  @IsString()
  tabGroup?: string;

  @ApiPropertyOptional({
    description: 'Free-text tile label shown on the category tile, e.g. "Limited Sale", "Premium"',
    example: 'Premium',
  })
  @IsOptional()
  @IsString()
  tileLabel?: string;

  @ApiPropertyOptional({
    description: 'Sort order within its tab group (lower shows first)',
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiPropertyOptional({
    description: 'Whether this category appears in the homepage "Latest Arrivals" section',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  showInLatestArrivals?: boolean;

  @ApiPropertyOptional({
    description: 'Whether this category appears in the homepage "Best Sellers" section',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  showInBestSellers?: boolean;
}

import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsArray, IsMongoId, ArrayMinSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFootwearSubcategoryDto {
  @ApiProperty({ description: 'Subcategory name shown on the tile', example: 'Running Shoes' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'URL-friendly slug, auto-generated from name if omitted', example: 'running-shoes' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ description: 'ImageKit URL for the tile image' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ description: 'Short offer text shown on the tile', example: 'Flat 40% Off' })
  @IsOptional()
  @IsString()
  offerText?: string;

  @ApiProperty({
    description: 'Tab labels this subcategory is grouped under on the homepage Footwear section — a tile can belong to more than one tab',
    example: ["Men's Shoes", 'Sports'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one tab is required' })
  @IsString({ each: true })
  tabNames: string[];

  @ApiPropertyOptional({ description: 'Product IDs mapped to this subcategory', type: [String] })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  productIds?: string[];

  @ApiPropertyOptional({ description: 'Sort order among subcategories within the tab (lower first)', example: 0 })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'Whether this subcategory is shown on the homepage', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

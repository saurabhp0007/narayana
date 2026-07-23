import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShopCategoryDto {
  @ApiProperty({ description: 'Category name shown as the homepage tab label', example: 'Sneakers' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'URL-friendly slug, auto-generated from name if omitted', example: 'sneakers' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ description: 'Sort order among tabs (lower shows first)', example: 0 })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'Whether this tab is shown on the homepage', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

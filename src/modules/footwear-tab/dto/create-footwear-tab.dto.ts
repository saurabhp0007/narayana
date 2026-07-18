import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFootwearTabDto {
  @ApiProperty({ description: 'Tab name shown on the homepage', example: "Men's Shoes" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'URL-friendly slug, auto-generated from name if omitted', example: 'mens-shoes' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ description: 'Left-to-right display order of the tab (lower first)', example: 0 })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'Whether the tab is shown on the homepage', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

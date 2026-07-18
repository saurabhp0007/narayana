import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHeroBannerDto {
  @ApiProperty({ description: 'ImageKit URL for the full-width banner image' })
  @IsString()
  @IsNotEmpty({ message: 'Image is required' })
  image: string;

  @ApiPropertyOptional({ description: 'Small text shown above the headline', example: 'New Arrivals' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  subtitle?: string;

  @ApiProperty({ description: 'Main headline text', example: 'SINGLE PAIR ₹6,000 / 3 PAIRS ₹15,000' })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(150)
  title: string;

  @ApiPropertyOptional({ description: 'CTA button text', example: 'Shop Now' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  buttonText?: string;

  @ApiProperty({ description: 'Where the slide/CTA links to', example: '/products?categoryName=Shoes' })
  @IsString()
  @IsNotEmpty({ message: 'Link URL is required' })
  linkUrl: string;

  @ApiPropertyOptional({ description: 'Whether this banner is active', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Sort order (lower shows first)', example: 0 })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

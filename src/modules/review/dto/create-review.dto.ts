import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsMongoId,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ description: 'Customer display name', example: 'Priya Sharma' })
  @IsString()
  @IsNotEmpty({ message: 'Customer name is required' })
  @MaxLength(100)
  customerName: string;

  @ApiPropertyOptional({ description: 'Customer location', example: 'Delhi' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @ApiProperty({ description: 'Star rating (1-5)', example: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: 'Review text', example: 'Great quality, fast delivery.' })
  @IsString()
  @IsNotEmpty({ message: 'Review text is required' })
  @MaxLength(2000)
  text: string;

  @ApiPropertyOptional({ description: 'Whether this is a verified purchase', example: true })
  @IsOptional()
  @IsBoolean()
  verifiedPurchase?: boolean;

  @ApiPropertyOptional({ description: 'Product this review is about' })
  @IsOptional()
  @IsMongoId()
  productId?: string;

  @ApiPropertyOptional({ description: 'Category this review is about' })
  @IsOptional()
  @IsMongoId()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Pill label shown on the review card', example: 'Formal Shirts' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  productLabel?: string;

  @ApiPropertyOptional({ description: 'Whether the review is approved for public display', example: true })
  @IsOptional()
  @IsBoolean()
  isApproved?: boolean;

  @ApiPropertyOptional({ description: 'Whether to feature this review on the homepage', example: false })
  @IsOptional()
  @IsBoolean()
  displayOnHomepage?: boolean;

  @ApiPropertyOptional({ description: 'Sort order (lower shows first)', example: 0 })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

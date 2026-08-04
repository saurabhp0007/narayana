import { IsMongoId, IsNotEmpty, IsNumber, Min, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({
    description: 'MongoDB ID of the product to add to cart',
    example: '507f1f77bcf86cd799439014',
  })
  @IsMongoId({ message: 'Invalid product ID' })
  @IsNotEmpty({ message: 'Product ID is required' })
  productId: string;

  @ApiPropertyOptional({
    description: 'Quantity of the product to add',
    example: 2,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Selected size, required when the product has sizes',
    example: 'M',
  })
  @IsOptional()
  @IsString()
  size?: string;
}

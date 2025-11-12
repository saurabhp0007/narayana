import { IsMongoId, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';

export class AddToCartDto {
  @IsMongoId({ message: 'Invalid product ID' })
  @IsNotEmpty({ message: 'Product ID is required' })
  productId: string;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity?: number;
}

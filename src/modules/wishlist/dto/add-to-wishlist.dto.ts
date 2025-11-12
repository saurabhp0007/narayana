import { IsMongoId, IsNotEmpty } from 'class-validator';

export class AddToWishlistDto {
  @IsMongoId({ message: 'Invalid product ID' })
  @IsNotEmpty({ message: 'Product ID is required' })
  productId: string;
}

import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsMongoId,
  IsEnum,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProductBadge } from '../schemas/product.schema';

export class UpdateProductDto {
  @ApiPropertyOptional({
    description: 'Name of the product',
    example: 'Classic Cotton T-Shirt',
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Product name must be at least 2 characters long' })
  @MaxLength(200, { message: 'Product name must not exceed 200 characters' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Stock Keeping Unit identifier',
    example: 'TSH-001',
  })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({
    description: 'Family SKU for product variants',
    example: 'TSH',
  })
  @IsOptional()
  @IsString()
  familySKU?: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the product',
    example: 'Comfortable cotton t-shirt for everyday wear',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000, { message: 'Description must not exceed 5000 characters' })
  description?: string;

  @ApiPropertyOptional({
    description: 'MongoDB ID of the gender category',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId({ message: 'Invalid gender ID' })
  genderId?: string;

  @ApiPropertyOptional({
    description: 'MongoDB ID of the category',
    example: '507f1f77bcf86cd799439012',
  })
  @IsOptional()
  @IsMongoId({ message: 'Invalid category ID' })
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Available sizes for the product',
    example: ['S', 'M', 'L', 'XL'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sizes?: string[];

  @ApiPropertyOptional({
    description: 'Available stock quantity',
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Stock cannot be negative' })
  stock?: number;

  @ApiPropertyOptional({
    description: 'Original price of the product',
    example: 29.99,
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Price must be a positive number' })
  price?: number;

  @ApiPropertyOptional({
    description: 'Discounted price of the product',
    example: 24.99,
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Discount price must be a positive number' })
  discountPrice?: number;

  @ApiPropertyOptional({
    description: 'Array of related product IDs',
    example: [],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true, message: 'Invalid product ID in related products' })
  relatedProductIds?: string[];

  @ApiPropertyOptional({
    description: 'Price threshold for "under price" category',
    example: 50,
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Under price amount must be a positive number' })
  underPriceAmount?: number;

  @ApiPropertyOptional({
    description: 'Array of product image URLs',
    example: ['https://example.com/tshirt1.jpg'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({
    description: 'Array of product video URLs',
    example: [],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  videos?: string[];

  @ApiPropertyOptional({
    description: 'Array of slider image URLs',
    example: [],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sliders?: string[];

  @ApiPropertyOptional({
    description: 'Whether the product is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Promotional badge shown on the product tile',
    enum: ProductBadge,
    example: ProductBadge.NEW,
  })
  @IsOptional()
  @IsEnum(ProductBadge)
  badge?: ProductBadge;

  @ApiPropertyOptional({
    description: 'Whether the product is featured in the Best Sellers homepage section',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isBestSeller?: boolean;

  @ApiPropertyOptional({
    description: 'Whether this product appears in the homepage Latest Arrivals slider. Only takes effect if its category also has showInLatestArrivals on.',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  showInLatestArrivals?: boolean;

  @ApiPropertyOptional({
    description:
      'Optional override category ID used only to group this product into a homepage Latest Arrivals / Best Sellers card. Lets a product be featured under a category other than its real one, without changing categoryId (which still drives shop listings/filters). Leave unset to group by categoryId as normal. Pass null to clear the override.',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId({ message: 'Invalid homepage category ID' })
  homepageCategoryId?: string | null;
}

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsMongoId,
  Min,
  MinLength,
  MaxLength,
  ArrayMinSize,
  IsUrl,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'Product name is required' })
  @MinLength(2, { message: 'Product name must be at least 2 characters long' })
  @MaxLength(200, { message: 'Product name must not exceed 200 characters' })
  name: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  familySKU?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000, { message: 'Description must not exceed 5000 characters' })
  description?: string;

  @IsMongoId({ message: 'Invalid gender ID' })
  @IsNotEmpty({ message: 'Gender ID is required' })
  genderId: string;

  @IsMongoId({ message: 'Invalid category ID' })
  @IsNotEmpty({ message: 'Category ID is required' })
  categoryId: string;

  @IsMongoId({ message: 'Invalid subcategory ID' })
  @IsNotEmpty({ message: 'Subcategory ID is required' })
  subcategoryId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sizes?: string[];

  @IsNumber()
  @Min(0, { message: 'Stock cannot be negative' })
  stock: number;

  @IsNumber()
  @Min(0, { message: 'Price must be a positive number' })
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Discount price must be a positive number' })
  discountPrice?: number;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true, message: 'Invalid product ID in related products' })
  relatedProductIds?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Under price amount must be a positive number' })
  underPriceAmount?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  videos?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sliders?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

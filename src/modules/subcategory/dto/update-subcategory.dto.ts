import { IsString, IsOptional, IsBoolean, MinLength, MaxLength, IsMongoId } from 'class-validator';

export class UpdateSubcategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsMongoId({ message: 'Invalid category ID' })
  categoryId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

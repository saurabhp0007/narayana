import { IsString, IsNotEmpty, IsOptional, IsBoolean, MinLength, MaxLength, IsMongoId } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsMongoId({ message: 'Invalid gender ID' })
  @IsNotEmpty({ message: 'Gender ID is required' })
  genderId: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

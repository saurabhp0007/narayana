import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateShippingRuleDto {
  @ApiProperty({ example: 'Luxury Shoes' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ type: [String], description: 'Categories this rule applies to' })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  categoryIds?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Footwear tiles this rule applies to' })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  footwearSubcategoryIds?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Shop-by-category tiles this rule applies to' })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  shopSubcategoryIds?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Category / tile slugs this rule applies to' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  slugs?: string[];

  @ApiProperty({
    type: [Number],
    example: [150, 300, 400],
    description: 'Total charge for 1, 2, 3… items; later items add additionalCharge each',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  charges: number[];

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  additionalCharge: number;

  @ApiPropertyOptional({ example: 1, description: 'Lower runs first when a product matches several rules' })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateShippingRuleDto extends PartialType(CreateShippingRuleDto) {}

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsBoolean,
  IsNumber,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSizeGroupDto {
  @ApiProperty({ description: 'Stable machine key', example: 'SHOE' })
  @IsString()
  @IsNotEmpty({ message: 'Key is required' })
  @MaxLength(40)
  key: string;

  @ApiProperty({ description: 'Display name shown in the size picker', example: 'Shoe Sizes (UK)' })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(80)
  name: string;

  @ApiPropertyOptional({ description: 'Measurement hint', example: 'Shoes Size' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  measurement?: string;

  @ApiPropertyOptional({ description: 'Free-text usage guidance', example: 'Sneakers / Casual / Formal' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  recommendedUse?: string;

  @ApiPropertyOptional({ description: 'Ordered size labels', type: [String], example: ['UK-6', 'UK-6.5'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sizes?: string[];

  @ApiPropertyOptional({ description: 'Sort order in the picker', example: 1 })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'Whether this group is offered', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

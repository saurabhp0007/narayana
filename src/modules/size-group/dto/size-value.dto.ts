import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SizeValueDto {
  @ApiProperty({ description: 'Size label to add', example: 'UK-15' })
  @IsString()
  @IsNotEmpty({ message: 'Size is required' })
  @MaxLength(30)
  size: string;
}

import { PartialType } from '@nestjs/swagger';
import { CreateFootwearSubcategoryDto } from './create-footwear-subcategory.dto';

export class UpdateFootwearSubcategoryDto extends PartialType(CreateFootwearSubcategoryDto) {}

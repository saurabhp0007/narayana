import { PartialType } from '@nestjs/swagger';
import { CreateShopSubcategoryDto } from './create-shop-subcategory.dto';

export class UpdateShopSubcategoryDto extends PartialType(CreateShopSubcategoryDto) {}

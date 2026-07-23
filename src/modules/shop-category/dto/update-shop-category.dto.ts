import { PartialType } from '@nestjs/swagger';
import { CreateShopCategoryDto } from './create-shop-category.dto';

export class UpdateShopCategoryDto extends PartialType(CreateShopCategoryDto) {}

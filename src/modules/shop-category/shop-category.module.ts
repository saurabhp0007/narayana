import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShopCategoryService } from './shop-category.service';
import { ShopCategoryController } from './shop-category.controller';
import { ShopCategory, ShopCategorySchema } from './schemas/shop-category.schema';
import { ShopSubcategory, ShopSubcategorySchema } from '../shop-subcategory/schemas/shop-subcategory.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ShopCategory.name, schema: ShopCategorySchema },
      { name: ShopSubcategory.name, schema: ShopSubcategorySchema },
    ]),
  ],
  controllers: [ShopCategoryController],
  providers: [ShopCategoryService],
  exports: [ShopCategoryService],
})
export class ShopCategoryModule {}

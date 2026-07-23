import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShopCategoryService } from './shop-category.service';
import { ShopCategoryController } from './shop-category.controller';
import { ShopCategory, ShopCategorySchema } from './schemas/shop-category.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: ShopCategory.name, schema: ShopCategorySchema }])],
  controllers: [ShopCategoryController],
  providers: [ShopCategoryService],
  exports: [ShopCategoryService],
})
export class ShopCategoryModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShopSubcategoryService } from './shop-subcategory.service';
import { ShopSubcategoryController } from './shop-subcategory.controller';
import { ShopSubcategory, ShopSubcategorySchema } from './schemas/shop-subcategory.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: ShopSubcategory.name, schema: ShopSubcategorySchema }])],
  controllers: [ShopSubcategoryController],
  providers: [ShopSubcategoryService],
  exports: [ShopSubcategoryService],
})
export class ShopSubcategoryModule {}

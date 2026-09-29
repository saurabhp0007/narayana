import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShopSubcategoryService } from './shop-subcategory.service';
import { ShopSubcategoryController } from './shop-subcategory.controller';
import { ShopSubcategory, ShopSubcategorySchema } from './schemas/shop-subcategory.schema';
import { Product, ProductSchema } from '../product/schemas/product.schema';

@Module({
  imports: [MongooseModule.forFeature([
      { name: ShopSubcategory.name, schema: ShopSubcategorySchema },
      { name: Product.name, schema: ProductSchema },
    ])],
  controllers: [ShopSubcategoryController],
  providers: [ShopSubcategoryService],
  exports: [ShopSubcategoryService],
})
export class ShopSubcategoryModule {}

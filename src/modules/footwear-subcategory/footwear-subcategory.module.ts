import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FootwearSubcategoryService } from './footwear-subcategory.service';
import { FootwearSubcategoryController } from './footwear-subcategory.controller';
import { FootwearSubcategory, FootwearSubcategorySchema } from './schemas/footwear-subcategory.schema';
import { Product, ProductSchema } from '../product/schemas/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FootwearSubcategory.name, schema: FootwearSubcategorySchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [FootwearSubcategoryController],
  providers: [FootwearSubcategoryService],
  exports: [FootwearSubcategoryService],
})
export class FootwearSubcategoryModule {}

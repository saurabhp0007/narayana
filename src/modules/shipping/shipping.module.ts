import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShippingService } from './shipping.service';
import { ShippingController } from './shipping.controller';
import { ShippingRule, ShippingRuleSchema } from './schemas/shipping-rule.schema';
import { Product, ProductSchema } from '../product/schemas/product.schema';
import { Category, CategorySchema } from '../category/schemas/category.schema';
import {
  FootwearSubcategory,
  FootwearSubcategorySchema,
} from '../footwear-subcategory/schemas/footwear-subcategory.schema';
import { ShopSubcategory, ShopSubcategorySchema } from '../shop-subcategory/schemas/shop-subcategory.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ShippingRule.name, schema: ShippingRuleSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Category.name, schema: CategorySchema },
      { name: FootwearSubcategory.name, schema: FootwearSubcategorySchema },
      { name: ShopSubcategory.name, schema: ShopSubcategorySchema },
    ]),
  ],
  controllers: [ShippingController],
  providers: [ShippingService],
  exports: [ShippingService],
})
export class ShippingModule {}

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Homepage "Shop by Category" tab label. Independent of each product's own
 * (root) Category/categoryId. Products are not mapped here directly — each
 * tab groups a set of ShopSubcategory tiles (image + offer text), and SKUs
 * are mapped onto those subcategories instead (see ShopSubcategory).
 */
@Schema({ timestamps: true })
export class ShopCategory extends Document {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ default: 0 })
  displayOrder: number;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const ShopCategorySchema = SchemaFactory.createForClass(ShopCategory);

ShopCategorySchema.index({ isActive: 1 });
ShopCategorySchema.index({ displayOrder: 1 });

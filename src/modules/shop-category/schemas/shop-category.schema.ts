import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Homepage "Shop by Category" tab: a label plus a hand-picked list of
 * products. Independent of each product's own (root) Category/categoryId —
 * mapping a product here has no effect on its real category elsewhere.
 */
@Schema({ timestamps: true })
export class ShopCategory extends Document {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ type: [Types.ObjectId], ref: 'Product', default: [] })
  productIds: Types.ObjectId[];

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

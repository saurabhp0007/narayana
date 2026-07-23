import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * A subcategory tile shown inside a homepage "Shop by Category" tab (e.g. tab
 * "Sneakers" contains subcategories "Running", "Casual"). Each tile has its
 * own image + offer text and links to a listing of its mapped products,
 * instead of products being mapped straight onto the ShopCategory tab.
 */
@Schema({ timestamps: true })
export class ShopSubcategory extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ default: '' })
  image: string; // ImageKit URL

  @Prop({ default: '' })
  offerText: string; // e.g. "Flat 40% Off"

  @Prop({ type: Types.ObjectId, ref: 'ShopCategory', required: true })
  shopCategoryId: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'Product', default: [] })
  productIds: Types.ObjectId[];

  @Prop({ default: 0 })
  displayOrder: number;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const ShopSubcategorySchema = SchemaFactory.createForClass(ShopSubcategory);

ShopSubcategorySchema.index({ shopCategoryId: 1, displayOrder: 1 });
ShopSubcategorySchema.index({ isActive: 1 });
ShopSubcategorySchema.index({ shopCategoryId: 1, name: 1 }, { unique: true });

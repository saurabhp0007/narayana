import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * A subcategory tile shown inside a homepage Footwear tab (e.g. tab "Men's Shoes"
 * contains subcategories "Running Shoes", "Sneakers"). Each tile has its own
 * image + offer text and links to a listing of its mapped products, instead of
 * the old behaviour where a tab tile pointed straight at a single product.
 */
@Schema({ timestamps: true })
export class FootwearSubcategory extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ default: '' })
  image: string; // ImageKit URL

  @Prop({ default: '' })
  offerText: string; // e.g. "Flat 40% Off"

  @Prop({ type: Types.ObjectId, ref: 'FootwearTab', required: true })
  footwearTabId: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'Product', default: [] })
  productIds: Types.ObjectId[];

  @Prop({ default: 0 })
  displayOrder: number;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const FootwearSubcategorySchema = SchemaFactory.createForClass(FootwearSubcategory);

FootwearSubcategorySchema.index({ footwearTabId: 1, displayOrder: 1 });
FootwearSubcategorySchema.index({ isActive: 1 });
FootwearSubcategorySchema.index({ footwearTabId: 1, name: 1 }, { unique: true });

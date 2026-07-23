import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * A subcategory tile shown inside a homepage Footwear tab group (e.g. tab name
 * "Men's Shoes" groups subcategories "Running Shoes", "Sneakers"). Tabs are not
 * a separate managed entity — a subcategory just carries the tab label it
 * belongs under, and the homepage groups tiles by that label. Each tile has its
 * own image + offer text and links to a listing of its mapped products.
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

  @Prop({ required: true, trim: true })
  tabName: string; // e.g. "Men's Shoes" — groups tiles on the homepage Footwear section

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

FootwearSubcategorySchema.index({ tabName: 1, displayOrder: 1 });
FootwearSubcategorySchema.index({ isActive: 1 });
FootwearSubcategorySchema.index({ tabName: 1, name: 1 }, { unique: true });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * A subcategory tile shown inside one or more homepage Footwear tab groups (e.g.
 * "Running Shoes" can appear under both the "Men's Shoes" tab and the "Sports" tab).
 * Tabs are not a separate managed entity — a subcategory just carries the tab labels
 * it belongs under, and the homepage groups tiles by each label. Each tile has its
 * own image + offer text and links to a listing of its mapped products.
 *
 * displayOrder is a single value shared across every tab this tile belongs to (there
 * is no per-tab ordering) — reordering it within one tab also moves it within any
 * other tab it's mapped to. Accepted tradeoff to avoid a per-(tab, subcategory)
 * ordering table for what is, in practice, rarely a multi-tab tile.
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

  @Prop({ type: [String], required: true })
  tabNames: string[]; // e.g. ["Men's Shoes", "Sports"] — groups tiles on the homepage Footwear section

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

FootwearSubcategorySchema.index({ tabNames: 1, displayOrder: 1 });
FootwearSubcategorySchema.index({ isActive: 1 });
FootwearSubcategorySchema.index({ tabNames: 1, name: 1 }, { unique: true });

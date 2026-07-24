import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Gender } from '../../gender/schemas/gender.schema';

@Schema({ timestamps: true })
export class Category extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ type: Types.ObjectId, ref: 'Gender', required: true })
  genderId: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  // Groups categories into homepage tab sections, e.g. "footwear" or "shop-by-category"
  @Prop({ trim: true })
  tabGroup: string;

  // Free-text tile label shown on the category tile, e.g. "Limited Sale", "Premium", "Combo"
  @Prop({ trim: true })
  tileLabel: string;

  @Prop({ default: 0 })
  displayOrder: number;

  // Whether this category appears in the homepage "Latest Arrivals" section
  @Prop({ default: false })
  showInLatestArrivals: boolean;

  // Whether this category appears in the homepage "Best Sellers" section
  @Prop({ default: false })
  showInBestSellers: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Indexes for faster lookups
CategorySchema.index({ name: 1, genderId: 1 }, { unique: true });
CategorySchema.index({ slug: 1, genderId: 1 }, { unique: true });
CategorySchema.index({ genderId: 1 });
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ tabGroup: 1 });
CategorySchema.index({ showInLatestArrivals: 1 });
CategorySchema.index({ showInBestSellers: 1 });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum ProductBadge {
  NEW = 'NEW',
  SALE = 'SALE',
  PREMIUM = 'PREMIUM',
  TRENDING = 'TRENDING',
  COMBO = 'COMBO',
  BEST_VALUE = 'BEST_VALUE',
  LIMITED_SALE = 'LIMITED_SALE',
  CASUAL = 'CASUAL',
  OFFER = 'OFFER',
  UNDER_1K = 'UNDER_1K',
  BUDGET_PICK = 'BUDGET_PICK',
  LUXURY = 'LUXURY',
}

@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  sku: string;

  @Prop({ uppercase: true, trim: true })
  familySKU: string;

  @Prop({ type: String, default: '' })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'Gender', required: true })
  genderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  sizes: string[];

  @Prop({ required: true, default: 0, min: 0 })
  stock: number;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ min: 0 })
  discountPrice: number;

  @Prop({ type: [Types.ObjectId], ref: 'Product', default: [] })
  relatedProductIds: Types.ObjectId[];

  @Prop({ min: 0 })
  underPriceAmount: number;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: [String], default: [] })
  videos: string[];

  @Prop({ type: [String], default: [] })
  sliders: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: String, enum: ProductBadge })
  badge: ProductBadge;

  @Prop({ default: false })
  isBestSeller: boolean;

  // Only takes effect when the product's category also has showInLatestArrivals on —
  // both must be true for the product to appear in the homepage Latest Arrivals slider
  @Prop({ default: false })
  showInLatestArrivals: boolean;

  // Optional override used only to group this product into a homepage Latest Arrivals /
  // Best Sellers card under a category other than its real categoryId (e.g. featuring a
  // Dresses product under the Women's Lingerie tile). Doesn't affect shop listings/filters,
  // which always use categoryId. Falls back to categoryId when unset.
  @Prop({ type: Types.ObjectId, ref: 'Category' })
  homepageCategoryId?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Indexes for faster lookups
ProductSchema.index({ sku: 1 });
ProductSchema.index({ familySKU: 1 });
ProductSchema.index({ name: 1 });
ProductSchema.index({ genderId: 1 });
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ stock: 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ showInLatestArrivals: 1 });
ProductSchema.index({ isBestSeller: 1 });
ProductSchema.index({ homepageCategoryId: 1 });
ProductSchema.index({ sizes: 1 });

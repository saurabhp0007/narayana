import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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

  @Prop({ type: Types.ObjectId, ref: 'Subcategory', required: true })
  subcategoryId: Types.ObjectId;

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
ProductSchema.index({ subcategoryId: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ stock: 1 });
ProductSchema.index({ createdAt: -1 });

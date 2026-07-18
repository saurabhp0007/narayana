import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Review extends Document {
  @Prop({ required: true, trim: true })
  customerName: string;

  @Prop({ trim: true })
  location: string;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ required: true, trim: true })
  text: string;

  @Prop({ default: true })
  verifiedPurchase: boolean;

  // Optional scoping: a review can be tied to a specific product and/or category
  // so pages can show reviews relevant to what's being browsed (e.g. Women's Footwear only).
  @Prop({ type: Types.ObjectId, ref: 'Product' })
  productId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category' })
  categoryId: Types.ObjectId;

  // Free-text label shown as a pill on the review card, e.g. "Formal Shirts", "Jeans"
  @Prop({ trim: true })
  productLabel: string;

  @Prop({ default: true })
  isApproved: boolean;

  @Prop({ default: false })
  displayOnHomepage: boolean;

  @Prop({ default: 0 })
  displayOrder: number;

  createdAt: Date;
  updatedAt: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

ReviewSchema.index({ isApproved: 1 });
ReviewSchema.index({ displayOnHomepage: 1 });
ReviewSchema.index({ categoryId: 1 });
ReviewSchema.index({ productId: 1 });
ReviewSchema.index({ createdAt: -1 });

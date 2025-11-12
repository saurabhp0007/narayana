import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum OfferType {
  BUY_X_GET_Y = 'buyXgetY',
  BUNDLE_DISCOUNT = 'bundleDiscount',
  PERCENTAGE_OFF = 'percentageOff',
  FIXED_AMOUNT_OFF = 'fixedAmountOff',
}

export class OfferRule {
  @Prop()
  buyQuantity?: number; // For buyXgetY

  @Prop()
  getQuantity?: number; // For buyXgetY

  @Prop()
  bundlePrice?: number; // For bundleDiscount (e.g., 2 for ₹700)

  @Prop()
  discountPercentage?: number; // For percentageOff

  @Prop()
  discountAmount?: number; // For fixedAmountOff

  @Prop()
  minQuantity?: number; // Minimum quantity to qualify
}

@Schema({ timestamps: true })
export class Offer extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: String, enum: OfferType, required: true })
  offerType: OfferType;

  @Prop({ type: OfferRule, required: true })
  rules: OfferRule;

  @Prop({ type: [Types.ObjectId], ref: 'Product', default: [] })
  productIds: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'Category', default: [] })
  categoryIds: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'Subcategory', default: [] })
  subcategoryIds: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'Gender', default: [] })
  genderIds: Types.ObjectId[];

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 1 })
  priority: number;

  createdAt: Date;
  updatedAt: Date;
}

export const OfferSchema = SchemaFactory.createForClass(Offer);

OfferSchema.index({ isActive: 1 });
OfferSchema.index({ startDate: 1, endDate: 1 });
OfferSchema.index({ priority: -1 });

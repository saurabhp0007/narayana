import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// A cart line lands in the first active rule (lowest priority) targeting its product's
// category or one of its footwear/shop tiles; lines matching nothing use the fallback rule.
// Charge for qty N = charges[N - 1] while N <= charges.length, then + additionalCharge per item.
@Schema({ timestamps: true })
export class ShippingRule extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: [Types.ObjectId], ref: 'Category', default: [] })
  categoryIds: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'FootwearSubcategory', default: [] })
  footwearSubcategoryIds: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'ShopSubcategory', default: [] })
  shopSubcategoryIds: Types.ObjectId[];

  @Prop({ type: [Number], required: true })
  charges: number[];

  @Prop({ required: true, min: 0 })
  additionalCharge: number;

  @Prop({ default: 0 })
  priority: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isFallback: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const ShippingRuleSchema = SchemaFactory.createForClass(ShippingRule);

ShippingRuleSchema.index({ priority: 1 });

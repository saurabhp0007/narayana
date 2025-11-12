import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Cart extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Admin', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ required: true, min: 1, default: 1 })
  quantity: number;

  @Prop()
  addedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const CartSchema = SchemaFactory.createForClass(Cart);

// Indexes for faster lookups
CartSchema.index({ userId: 1 });
CartSchema.index({ productId: 1 });
CartSchema.index({ userId: 1, productId: 1 }, { unique: true });
CartSchema.index({ createdAt: -1 });

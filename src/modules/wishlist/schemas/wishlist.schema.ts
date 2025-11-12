import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Wishlist extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Admin', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop()
  addedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const WishlistSchema = SchemaFactory.createForClass(Wishlist);

// Indexes for faster lookups
WishlistSchema.index({ userId: 1 });
WishlistSchema.index({ productId: 1 });
WishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });
WishlistSchema.index({ createdAt: -1 });

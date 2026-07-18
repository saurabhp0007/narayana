import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Curated homepage product showcase: a banner image plus a hand-picked,
 * ordered list of existing products. Multiple collections can be active at
 * once and each renders as its own banner + product-strip row on the
 * homepage, ordered by displayOrder.
 */
@Schema({ timestamps: true })
export class Collection extends Document {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ default: '' })
  bannerImage: string; // ImageKit URL

  @Prop({ type: [Types.ObjectId], ref: 'Product', default: [] })
  productIds: Types.ObjectId[];

  @Prop({ default: 0 })
  displayOrder: number;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const CollectionSchema = SchemaFactory.createForClass(Collection);

CollectionSchema.index({ isActive: 1 });
CollectionSchema.index({ displayOrder: 1 });

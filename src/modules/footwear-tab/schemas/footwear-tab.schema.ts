import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// A tab in the homepage Footwear section (e.g. "Deals & Combos", "Men's Shoes").
// Fully admin-managed so tabs can be added/renamed/reordered without a code change.
@Schema({ timestamps: true })
export class FootwearTab extends Document {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ default: 0 })
  displayOrder: number;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const FootwearTabSchema = SchemaFactory.createForClass(FootwearTab);

FootwearTabSchema.index({ displayOrder: 1 });
FootwearTabSchema.index({ isActive: 1 });

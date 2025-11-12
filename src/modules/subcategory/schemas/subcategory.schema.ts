import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Category } from '../../category/schemas/category.schema';

@Schema({ timestamps: true })
export class Subcategory extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const SubcategorySchema = SchemaFactory.createForClass(Subcategory);

// Indexes for faster lookups
SubcategorySchema.index({ name: 1, categoryId: 1 }, { unique: true });
SubcategorySchema.index({ slug: 1, categoryId: 1 }, { unique: true });
SubcategorySchema.index({ categoryId: 1 });
SubcategorySchema.index({ isActive: 1 });

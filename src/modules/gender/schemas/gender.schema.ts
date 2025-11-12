import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Gender extends Document {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const GenderSchema = SchemaFactory.createForClass(Gender);

// Indexes for faster lookups
GenderSchema.index({ name: 1 });
GenderSchema.index({ slug: 1 });
GenderSchema.index({ isActive: 1 });

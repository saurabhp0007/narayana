import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class SizeGroup extends Document {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  key: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: '', trim: true })
  measurement: string;

  @Prop({ default: '', trim: true })
  recommendedUse: string;

  @Prop({ type: [String], default: [] })
  sizes: string[];

  @Prop({ default: 0 })
  displayOrder: number;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const SizeGroupSchema = SchemaFactory.createForClass(SizeGroup);

SizeGroupSchema.index({ isActive: 1, displayOrder: 1 });

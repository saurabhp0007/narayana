import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Top-of-homepage hero carousel slide. Deliberately independent of Offer —
 * a hero banner is a marketing slide, not a discount rule, and shouldn't
 * require creating/editing a promotional offer just to change a homepage image.
 */
@Schema({ timestamps: true })
export class HeroBanner extends Document {
  @Prop({ required: true })
  image: string; // ImageKit URL

  @Prop()
  mobileImage: string; // optional ImageKit URL shown instead of `image` on mobile-sized screens

  @Prop({ trim: true })
  subtitle: string; // small text above the headline, e.g. "New Arrivals"

  @Prop({ required: true, trim: true })
  title: string; // main headline, e.g. "SINGLE PAIR ₹6,000 / 3 PAIRS ₹15,000"

  @Prop({ default: 'Shop Now', trim: true })
  buttonText: string;

  @Prop({ required: true, trim: true })
  linkUrl: string; // where the CTA button and slide click through to, e.g. /products?categoryName=Shoes

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  displayOrder: number;

  createdAt: Date;
  updatedAt: Date;
}

export const HeroBannerSchema = SchemaFactory.createForClass(HeroBanner);

HeroBannerSchema.index({ isActive: 1 });
HeroBannerSchema.index({ displayOrder: 1 });

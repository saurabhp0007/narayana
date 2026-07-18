import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Singleton document holding homepage display toggles that don't belong to any
 * other domain model (e.g. the countdown timer, which is independent of Offers).
 */
@Schema({ timestamps: true })
export class HomepageSettings extends Document {
  @Prop({ default: false })
  countdownEnabled: boolean;

  @Prop()
  countdownEndDate: Date;

  @Prop({ default: 'Mega Sale' })
  countdownLabel: string;

  @Prop({ default: false })
  announcementBarEnabled: boolean;

  @Prop()
  announcementBarText: string;

  createdAt: Date;
  updatedAt: Date;
}

export const HomepageSettingsSchema = SchemaFactory.createForClass(HomepageSettings);

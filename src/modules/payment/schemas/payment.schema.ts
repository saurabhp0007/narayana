import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum PaymentStatus {
  INITIATED = 'initiated',
  SUCCESS = 'success',
  FAILURE = 'failure',
  PENDING = 'pending',
  CANCELLED = 'cancelled',
}

// Which channel resolved the payment. Every channel funnels through the same
// idempotent resolver, this just records who got there first.
export enum PaymentResolvedVia {
  BOLT = 'bolt',
  CALLBACK = 'callback',
  WEBHOOK = 'webhook',
  VERIFY_API = 'verify_api',
}

@Schema({ timestamps: true })
export class Payment extends Document {
  @Prop({ required: true, unique: true })
  txnid: string;

  @Prop({ required: true })
  orderId: string;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderRef: Types.ObjectId;

  @Prop()
  userId?: string;

  @Prop()
  guestId?: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true })
  productinfo: string;

  @Prop({ required: true })
  firstname: string;

  @Prop({ required: true })
  email: string;

  @Prop()
  phone?: string;

  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.INITIATED })
  status: PaymentStatus;

  @Prop({ type: String, enum: PaymentResolvedVia })
  resolvedVia?: PaymentResolvedVia;

  @Prop()
  payuMihpayid?: string;

  @Prop()
  payuMode?: string;

  @Prop()
  bankRefNum?: string;

  @Prop()
  errorCode?: string;

  @Prop()
  errorMessage?: string;

  // Raw last payload received from PayU (callback / webhook / verify response).
  @Prop({ type: Object })
  payuResponse?: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ createdAt: -1 });

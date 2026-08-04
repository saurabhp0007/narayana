import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true })
  sku: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ trim: true })
  size?: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ min: 0 })
  discountPrice: number;

  @Prop({ type: [String], default: [] })
  images: string[];
}

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ required: true, unique: true })
  orderId: string;

  // Optional: guest checkouts have no registered account, so this is unset and
  // `guestId`/`customerName` carry the customer info instead.
  @Prop({ type: Types.ObjectId, ref: 'Admin', required: false })
  userId?: Types.ObjectId;

  // Set only for guest checkouts (no `userId`) — lets admins trace/debug a guest order
  // back to its Redis cart session even though there's no account record.
  @Prop({ trim: true })
  guestId?: string;

  // Guest checkouts have no account to pull a name from, so it's captured directly here.
  @Prop({ trim: true })
  customerName?: string;

  @Prop({ type: [OrderItem], required: true })
  items: OrderItem[];

  @Prop({ required: true, min: 0 })
  subtotal: number;

  @Prop({ default: 0, min: 0 })
  discount: number;

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({ required: true, default: 0 })
  totalItems: number;

  @Prop({
    type: String,
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Prop()
  notes: string;

  @Prop()
  shippingAddress: string;

  @Prop()
  contactEmail: string;

  @Prop()
  contactPhone: string;

  createdAt: Date;
  updatedAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Indexes for faster lookups
OrderSchema.index({ orderId: 1 }, { unique: true });
OrderSchema.index({ userId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });

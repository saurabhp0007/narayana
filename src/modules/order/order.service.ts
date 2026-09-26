import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Order,
  OrderStatus,
  PaymentMethod,
  OrderPaymentStatus,
  allowedNextStatuses,
} from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CartService } from '../cart/cart.service';
import { ProductService } from '../product/product.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectModel(Order.name)
    private orderModel: Model<Order>,
    private cartService: CartService,
    private productService: ProductService,
    private emailService: EmailService,
  ) {}

  async createOrderFromCart(userId: string, createOrderDto: CreateOrderDto): Promise<Order> {
    // Get cart with all items
    const cart = await this.cartService.getCart(userId);

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Verify stock for all items
    for (const cartItem of cart.items) {
      const product = await this.productService.findOne(cartItem.product._id);

      if (!product.isActive) {
        throw new BadRequestException(`Product ${product.name} is no longer available`);
      }

      const availableStock = this.productService.resolveAvailableStock(product, cartItem.size);
      if (availableStock < cartItem.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${product.name}. Available: ${availableStock}, Required: ${cartItem.quantity}`,
        );
      }
    }

    // Generate unique order ID
    const orderId = await this.generateOrderId();

    // Create order items
    const orderItems = cart.items.map((cartItem) => ({
      productId: new Types.ObjectId(cartItem.product._id),
      productName: cartItem.product.name,
      sku: cartItem.product.sku,
      size: cartItem.size,
      quantity: cartItem.quantity,
      price: cartItem.price,
      discountPrice: cartItem.product.discountPrice,
      images: cartItem.product.images || [],
    }));

    // Create order
    const order = new this.orderModel({
      orderId,
      userId: new Types.ObjectId(userId),
      items: orderItems,
      subtotal: cart.summary.subtotal,
      discount: cart.summary.totalDiscount,
      totalAmount: cart.summary.total,
      totalItems: cart.summary.totalItems,
      status: OrderStatus.PENDING,
      paymentMethod: PaymentMethod.COD,
      paymentStatus: OrderPaymentStatus.NOT_REQUIRED,
      notes: createOrderDto.notes,
      shippingAddress: createOrderDto.shippingAddress,
      contactEmail: createOrderDto.contactEmail,
      contactPhone: createOrderDto.contactPhone,
    });

    // Save order
    await order.save();

    // Deduct stock (in a transaction-like manner)
    try {
      for (const cartItem of cart.items) {
        await this.productService.updateStock(cartItem.product._id, -cartItem.quantity, cartItem.size);
      }
    } catch (error) {
      // Rollback: delete the order if stock update fails
      await order.deleteOne();
      throw new InternalServerErrorException('Failed to update stock. Order creation cancelled.');
    }

    // Clear cart after successful order
    await this.cartService.clearCart(userId);

    // Send order confirmation email
    if (createOrderDto.contactEmail) {
      await this.emailService.sendOrderConfirmation(createOrderDto.contactEmail, {
        orderId: order.orderId,
        items: orderItems,
        totalAmount: order.totalAmount,
        subtotal: order.subtotal,
        discount: order.discount,
      });
    }

    return order;
  }

  // Mirrors createOrderFromCart but for a guest checkout: no userId (guest has no
  // account), the cart is passed in already resolved (GuestService owns the Redis cart),
  // and the caller clears that cart afterward instead of this method doing it. Without
  // this, guest checkouts previously only wrote an ad-hoc object into Redis — never a
  // real Order document — so they never showed up in the admin orders list and never
  // decremented product stock.
  async createOrderFromGuestCart(
    cart: { items: any[]; summary: any },
    guestId: string,
    details: {
      customerName: string;
      contactEmail?: string;
      contactPhone?: string;
      shippingAddress?: string;
      notes?: string;
    },
  ): Promise<Order> {
    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Verify stock for all items
    for (const cartItem of cart.items) {
      const product = await this.productService.findOne(cartItem.product._id);

      if (!product.isActive) {
        throw new BadRequestException(`Product ${product.name} is no longer available`);
      }

      const availableStock = this.productService.resolveAvailableStock(product, cartItem.size);
      if (availableStock < cartItem.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${product.name}. Available: ${availableStock}, Required: ${cartItem.quantity}`,
        );
      }
    }

    const orderId = await this.generateOrderId();

    const orderItems = cart.items.map((cartItem) => ({
      productId: new Types.ObjectId(cartItem.product._id),
      productName: cartItem.product.name,
      sku: cartItem.product.sku,
      size: cartItem.size,
      quantity: cartItem.quantity,
      price: cartItem.price,
      discountPrice: cartItem.product.discountPrice,
      images: cartItem.product.images || [],
    }));

    const order = new this.orderModel({
      orderId,
      guestId,
      customerName: details.customerName,
      items: orderItems,
      subtotal: cart.summary.subtotal,
      discount: cart.summary.totalDiscount,
      totalAmount: cart.summary.total,
      totalItems: cart.summary.totalItems,
      status: OrderStatus.PENDING,
      paymentMethod: PaymentMethod.COD,
      paymentStatus: OrderPaymentStatus.NOT_REQUIRED,
      notes: details.notes,
      shippingAddress: details.shippingAddress,
      contactEmail: details.contactEmail,
      contactPhone: details.contactPhone,
    });

    await order.save();

    // Deduct stock (in a transaction-like manner)
    try {
      for (const cartItem of cart.items) {
        await this.productService.updateStock(cartItem.product._id, -cartItem.quantity, cartItem.size);
      }
    } catch (error) {
      // Rollback: delete the order if stock update fails
      await order.deleteOne();
      throw new InternalServerErrorException('Failed to update stock. Order creation cancelled.');
    }

    // Send order confirmation email
    if (details.contactEmail) {
      await this.emailService.sendOrderConfirmation(details.contactEmail, {
        orderId: order.orderId,
        items: orderItems,
        totalAmount: order.totalAmount,
        subtotal: order.subtotal,
        discount: order.discount,
      });
    }

    return order;
  }

  // ==================== ONLINE PAYMENT (PayU) ====================

  // Creates an order in PAYMENT_PENDING state from an already-resolved cart. Unlike
  // the COD paths, stock is NOT deducted, the cart is NOT cleared and no email is
  // sent here — that all happens in markPayuOrderPaid once PayU confirms the payment.
  async createPendingPayuOrder(params: {
    userId?: string;
    guestId?: string;
    customerName?: string;
    cart: { items: any[]; summary: any };
    contactEmail?: string;
    contactPhone?: string;
    shippingAddress?: string;
    notes?: string;
  }): Promise<Order> {
    const { cart } = params;

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    for (const cartItem of cart.items) {
      const product = await this.productService.findOne(cartItem.product._id);

      if (!product.isActive) {
        throw new BadRequestException(`Product ${product.name} is no longer available`);
      }

      const availableStock = this.productService.resolveAvailableStock(product, cartItem.size);
      if (availableStock < cartItem.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${product.name}. Available: ${availableStock}, Required: ${cartItem.quantity}`,
        );
      }
    }

    const orderId = await this.generateOrderId();

    const orderItems = cart.items.map((cartItem) => ({
      productId: new Types.ObjectId(cartItem.product._id),
      productName: cartItem.product.name,
      sku: cartItem.product.sku,
      size: cartItem.size,
      quantity: cartItem.quantity,
      price: cartItem.price,
      discountPrice: cartItem.product.discountPrice,
      images: cartItem.product.images || [],
    }));

    const order = new this.orderModel({
      orderId,
      userId: params.userId ? new Types.ObjectId(params.userId) : undefined,
      guestId: params.guestId,
      customerName: params.customerName,
      items: orderItems,
      subtotal: cart.summary.subtotal,
      discount: cart.summary.totalDiscount,
      totalAmount: cart.summary.total,
      totalItems: cart.summary.totalItems,
      status: OrderStatus.PAYMENT_PENDING,
      paymentMethod: PaymentMethod.PAYU,
      paymentStatus: OrderPaymentStatus.PENDING,
      notes: params.notes,
      shippingAddress: params.shippingAddress,
      contactEmail: params.contactEmail,
      contactPhone: params.contactPhone,
    });

    await order.save();
    return order;
  }

  // Called once PayU confirms a successful payment (via any channel). Idempotent:
  // multiple channels (callback, webhook, status poll) can race here, so the paid
  // transition is claimed atomically and stock/email only run for the claimer.
  async markPayuOrderPaid(orderId: string, txnid: string): Promise<Order> {
    const order = await this.orderModel.findOneAndUpdate(
      { orderId, paymentStatus: { $ne: OrderPaymentStatus.PAID } },
      {
        $set: {
          status: OrderStatus.PENDING,
          paymentStatus: OrderPaymentStatus.PAID,
          txnid,
          paidAt: new Date(),
        },
      },
      { new: true },
    );

    if (!order) {
      // Already paid by another channel, or the order no longer exists.
      return this.orderModel.findOne({ orderId });
    }

    // Customer has already paid, so a stock shortfall here can't block the order —
    // deduct anyway (may go negative) and log it for the admin to reconcile.
    for (const item of order.items) {
      try {
        await this.productService.updateStock(
          item.productId.toString(),
          -item.quantity,
          item.size,
        );
      } catch (error) {
        this.logger.error(
          `Stock deduction failed for paid order ${orderId}, product ${item.productId}: ${error.message}`,
        );
      }
    }

    if (order.contactEmail) {
      await this.emailService.sendOrderConfirmation(order.contactEmail, {
        orderId: order.orderId,
        items: order.items,
        totalAmount: order.totalAmount,
        subtotal: order.subtotal,
        discount: order.discount,
      });
    }

    return order;
  }

  // Called when PayU reports the payment failed/was cancelled. Leaves the order in
  // place (no stock was taken) so the customer can retry. Never overrides a paid order.
  async markPayuOrderFailed(orderId: string, txnid?: string): Promise<Order> {
    const order = await this.orderModel.findOne({ orderId });
    if (!order) {
      throw new NotFoundException(`Order with Order ID ${orderId} not found`);
    }

    if (order.paymentStatus === OrderPaymentStatus.PAID) {
      return order;
    }

    order.status = OrderStatus.PAYMENT_FAILED;
    order.paymentStatus = OrderPaymentStatus.FAILED;
    if (txnid) order.txnid = txnid;
    await order.save();

    return order;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: {
      userId?: string;
      status?: OrderStatus;
      fromDate?: Date;
      toDate?: Date;
      hideIncompletePayments?: boolean;
    },
  ): Promise<any> {
    const skip = (page - 1) * limit;
    const filter: any = {};

    if (filters?.userId) {
      filter.userId = new Types.ObjectId(filters.userId);
    }

    if (filters?.status) {
      filter.status = filters.status;
    } else if (filters?.hideIncompletePayments) {
      // Customer-facing lists shouldn't surface abandoned/failed payment attempts.
      filter.status = {
        $nin: [OrderStatus.PAYMENT_PENDING, OrderStatus.PAYMENT_FAILED],
      };
    }

    if (filters?.fromDate || filters?.toDate) {
      filter.createdAt = {};
      if (filters.fromDate) {
        filter.createdAt.$gte = filters.fromDate;
      }
      if (filters.toDate) {
        filter.createdAt.$lte = filters.toDate;
      }
    }

    const [data, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .populate('userId', 'email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.orderModel.countDocuments(filter),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderModel
      .findById(id)
      .populate('userId', 'email')
      .populate('items.productId', 'name sku isActive')
      .exec();

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async findByOrderId(orderId: string): Promise<Order> {
    const order = await this.orderModel
      .findOne({ orderId })
      .populate('userId', 'email')
      .populate('items.productId', 'name sku isActive')
      .exec();

    if (!order) {
      throw new NotFoundException(`Order with Order ID ${orderId} not found`);
    }

    return order;
  }

  async findUserOrders(userId: string, page: number = 1, limit: number = 10): Promise<any> {
    return this.findAll(page, limit, { userId, hideIncompletePayments: true });
  }

  async updateStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.findOne(id);
    const { status } = updateOrderStatusDto;

    if (status === order.status) {
      return order;
    }
    if (!allowedNextStatuses(order.status).includes(status)) {
      throw new BadRequestException(`Cannot change order status from ${order.status} to ${status}`);
    }

    order.status = status;
    await order.save();

    if (status === OrderStatus.CANCELLED) {
      await this.restoreStock(order);
    }

    // Send status update email
    if (order.contactEmail) {
      await this.emailService.sendOrderStatusUpdate(order.contactEmail, {
        orderId: order.orderId,
        status: order.status,
        totalAmount: order.totalAmount,
      });
    }

    return order;
  }

  private async restoreStock(order: Order): Promise<void> {
    for (const item of order.items) {
      const productId = (item.productId as any)?._id ?? item.productId;
      try {
        await this.productService.updateStock(productId.toString(), item.quantity, item.size);
      } catch (error) {
        this.logger.error(
          `Stock restore failed for cancelled order ${order.orderId}, product ${productId}: ${error.message}`,
        );
      }
    }
  }

  async getOrderStats(userId?: string): Promise<any> {
    const filter: any = userId ? { userId: new Types.ObjectId(userId) } : {};

    const stats = await this.orderModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
        },
      },
    ]);

    const byStatus = stats.reduce((acc: any, stat: any) => {
      acc[stat._id] = { count: stat.count, totalAmount: stat.totalAmount };
      return acc;
    }, {});

    const totalOrders = await this.orderModel.countDocuments(filter);
    const countFor = (status: OrderStatus) => byStatus[status]?.count || 0;

    // Revenue = money actually owed to the shop: exclude incomplete-payment and
    // cancelled orders, count everything else (COD + paid online).
    const nonRevenue: OrderStatus[] = [
      OrderStatus.PAYMENT_PENDING,
      OrderStatus.PAYMENT_FAILED,
      OrderStatus.CANCELLED,
    ];
    const totalRevenue = await this.orderModel.aggregate([
      { $match: { ...filter, status: { $nin: nonRevenue } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    return {
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      pendingOrders: countFor(OrderStatus.PENDING),
      confirmedOrders: countFor(OrderStatus.CONFIRMED),
      processingOrders: countFor(OrderStatus.PROCESSING),
      packedOrders: countFor(OrderStatus.PACKED),
      shippedOrders: countFor(OrderStatus.SHIPPED),
      deliveredOrders: countFor(OrderStatus.DELIVERED),
      cancelledOrders: countFor(OrderStatus.CANCELLED),
      paymentPendingOrders: countFor(OrderStatus.PAYMENT_PENDING),
      paymentFailedOrders: countFor(OrderStatus.PAYMENT_FAILED),
      byStatus,
    };
  }

  private async generateOrderId(): Promise<string> {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `ORD-${timestamp}-${random}`;
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderStatus } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CartService } from '../cart/cart.service';
import { ProductService } from '../product/product.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class OrderService {
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

      if (product.stock < cartItem.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${product.name}. Available: ${product.stock}, Required: ${cartItem.quantity}`,
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
        await this.productService.updateStock(cartItem.product._id, -cartItem.quantity);
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

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: {
      userId?: string;
      status?: OrderStatus;
      fromDate?: Date;
      toDate?: Date;
    },
  ): Promise<any> {
    const skip = (page - 1) * limit;
    const filter: any = {};

    if (filters?.userId) {
      filter.userId = new Types.ObjectId(filters.userId);
    }

    if (filters?.status) {
      filter.status = filters.status;
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
    return this.findAll(page, limit, { userId });
  }

  async updateStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.findOne(id);

    order.status = updateOrderStatusDto.status;
    await order.save();

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

    const totalOrders = await this.orderModel.countDocuments(filter);
    const totalRevenue = await this.orderModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
        },
      },
    ]);

    return {
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      byStatus: stats.reduce((acc: any, stat: any) => {
        acc[stat._id] = {
          count: stat.count,
          totalAmount: stat.totalAmount,
        };
        return acc;
      }, {}),
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

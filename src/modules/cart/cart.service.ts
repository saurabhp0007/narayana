import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart } from './schemas/cart.schema';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { ProductService } from '../product/product.service';
import { RedisService } from '../../database/redis.service';

@Injectable()
export class CartService {
  private readonly CART_CACHE_PREFIX = 'cart:';
  private readonly CART_CACHE_TTL = 86400; // 24 hours

  constructor(
    @InjectModel(Cart.name)
    private cartModel: Model<Cart>,
    private productService: ProductService,
    private redisService: RedisService,
  ) {}

  async addToCart(userId: string, addToCartDto: AddToCartDto): Promise<Cart> {
    // Validate product exists and has stock
    const product = await this.productService.findOne(addToCartDto.productId);

    if (!product.isActive) {
      throw new BadRequestException('Product is not available');
    }

    const quantity = addToCartDto.quantity || 1;

    if (product.stock < quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`,
      );
    }

    // Check if product already in cart
    const existingCartItem = await this.cartModel.findOne({
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(addToCartDto.productId),
    });

    if (existingCartItem) {
      // Update quantity
      const newQuantity = existingCartItem.quantity + quantity;

      if (product.stock < newQuantity) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${product.stock}, In cart: ${existingCartItem.quantity}`,
        );
      }

      existingCartItem.quantity = newQuantity;
      await existingCartItem.save();

      // Invalidate cache
      await this.invalidateCartCache(userId);

      return existingCartItem;
    }

    // Create new cart item
    const cartItem = new this.cartModel({
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(addToCartDto.productId),
      quantity,
      addedAt: new Date(),
    });

    await cartItem.save();

    // Invalidate cache
    await this.invalidateCartCache(userId);

    return cartItem;
  }

  async getCart(userId: string): Promise<any> {
    // Try to get from cache first
    const cacheKey = this.getCacheKey(userId);
    const cachedCart = await this.redisService.get(cacheKey);

    if (cachedCart) {
      return JSON.parse(cachedCart);
    }

    // Get from database
    const cartItems = await this.cartModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate({
        path: 'productId',
        select: 'name sku price discountPrice images stock isActive',
      })
      .sort({ createdAt: -1 })
      .exec();

    // Calculate totals
    const result = this.calculateCartTotals(cartItems);

    // Cache the result
    await this.redisService.set(cacheKey, JSON.stringify(result), this.CART_CACHE_TTL);

    return result;
  }

  async updateCartItem(userId: string, cartItemId: string, updateCartDto: UpdateCartDto): Promise<Cart> {
    const cartItem = await this.cartModel.findOne({
      _id: cartItemId,
      userId: new Types.ObjectId(userId),
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    // Validate stock
    const product = await this.productService.findOne(cartItem.productId.toString());

    if (product.stock < updateCartDto.quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${product.stock}, Requested: ${updateCartDto.quantity}`,
      );
    }

    cartItem.quantity = updateCartDto.quantity;
    await cartItem.save();

    // Invalidate cache
    await this.invalidateCartCache(userId);

    return cartItem;
  }

  async removeFromCart(userId: string, cartItemId: string): Promise<{ message: string }> {
    const result = await this.cartModel.deleteOne({
      _id: cartItemId,
      userId: new Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Cart item not found');
    }

    // Invalidate cache
    await this.invalidateCartCache(userId);

    return { message: 'Item removed from cart successfully' };
  }

  async clearCart(userId: string): Promise<{ message: string }> {
    await this.cartModel.deleteMany({ userId: new Types.ObjectId(userId) });

    // Invalidate cache
    await this.invalidateCartCache(userId);

    return { message: 'Cart cleared successfully' };
  }

  async getCartItemCount(userId: string): Promise<{ count: number }> {
    const count = await this.cartModel.countDocuments({
      userId: new Types.ObjectId(userId),
    });

    return { count };
  }

  private calculateCartTotals(cartItems: any[]): any {
    let subtotal = 0;
    let totalDiscount = 0;
    let total = 0;
    let totalItems = 0;

    const items = cartItems.map((item) => {
      const product = item.productId;
      const price = product.discountPrice || product.price;
      const itemTotal = price * item.quantity;
      const discount = product.discountPrice
        ? (product.price - product.discountPrice) * item.quantity
        : 0;

      subtotal += product.price * item.quantity;
      totalDiscount += discount;
      total += itemTotal;
      totalItems += item.quantity;

      return {
        _id: item._id,
        product: {
          _id: product._id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          discountPrice: product.discountPrice,
          images: product.images,
          stock: product.stock,
          isActive: product.isActive,
        },
        quantity: item.quantity,
        price: price,
        itemTotal: itemTotal,
        discount: discount,
        addedAt: item.addedAt,
      };
    });

    return {
      items,
      summary: {
        subtotal,
        totalDiscount,
        total,
        totalItems,
        itemCount: items.length,
      },
    };
  }

  private getCacheKey(userId: string): string {
    return `${this.CART_CACHE_PREFIX}${userId}`;
  }

  private async invalidateCartCache(userId: string): Promise<void> {
    const cacheKey = this.getCacheKey(userId);
    await this.redisService.del(cacheKey);
  }

  async removeCartItemsByProduct(productId: string): Promise<void> {
    await this.cartModel.deleteMany({ productId: new Types.ObjectId(productId) });
  }
}

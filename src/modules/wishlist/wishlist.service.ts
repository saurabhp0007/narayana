import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wishlist } from './schemas/wishlist.schema';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
import { ProductService } from '../product/product.service';
import { RedisService } from '../../database/redis.service';

@Injectable()
export class WishlistService {
  private readonly WISHLIST_CACHE_PREFIX = 'wishlist:';
  private readonly WISHLIST_CACHE_TTL = 86400; // 24 hours

  constructor(
    @InjectModel(Wishlist.name)
    private wishlistModel: Model<Wishlist>,
    private productService: ProductService,
    private redisService: RedisService,
  ) {}

  async addToWishlist(userId: string, addToWishlistDto: AddToWishlistDto): Promise<Wishlist> {
    // Validate product exists
    const product = await this.productService.findOne(addToWishlistDto.productId);

    if (!product.isActive) {
      throw new BadRequestException('Product is not available');
    }

    // Check if product already in wishlist
    const existingWishlistItem = await this.wishlistModel.findOne({
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(addToWishlistDto.productId),
    });

    if (existingWishlistItem) {
      throw new ConflictException('Product already in wishlist');
    }

    // Create new wishlist item
    const wishlistItem = new this.wishlistModel({
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(addToWishlistDto.productId),
      addedAt: new Date(),
    });

    await wishlistItem.save();

    // Invalidate cache
    await this.invalidateWishlistCache(userId);

    return wishlistItem;
  }

  async getWishlist(userId: string): Promise<any> {
    // Try to get from cache first
    const cacheKey = this.getCacheKey(userId);
    const cachedWishlist = await this.redisService.get(cacheKey);

    if (cachedWishlist) {
      return JSON.parse(cachedWishlist);
    }

    // Get from database
    const wishlistItems = await this.wishlistModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate({
        path: 'productId',
        select: 'name sku price discountPrice images stock isActive',
      })
      .sort({ createdAt: -1 })
      .exec();

    const result = {
      items: wishlistItems.map((item) => ({
        _id: item._id,
        product: item.productId,
        addedAt: item.addedAt,
      })),
      count: wishlistItems.length,
    };

    // Cache the result
    await this.redisService.set(cacheKey, JSON.stringify(result), this.WISHLIST_CACHE_TTL);

    return result;
  }

  async removeFromWishlist(userId: string, wishlistItemId: string): Promise<{ message: string }> {
    const result = await this.wishlistModel.deleteOne({
      _id: wishlistItemId,
      userId: new Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Wishlist item not found');
    }

    // Invalidate cache
    await this.invalidateWishlistCache(userId);

    return { message: 'Item removed from wishlist successfully' };
  }

  async clearWishlist(userId: string): Promise<{ message: string }> {
    await this.wishlistModel.deleteMany({ userId: new Types.ObjectId(userId) });

    // Invalidate cache
    await this.invalidateWishlistCache(userId);

    return { message: 'Wishlist cleared successfully' };
  }

  async getWishlistItemCount(userId: string): Promise<{ count: number }> {
    const count = await this.wishlistModel.countDocuments({
      userId: new Types.ObjectId(userId),
    });

    return { count };
  }

  async isInWishlist(userId: string, productId: string): Promise<{ inWishlist: boolean }> {
    const exists = await this.wishlistModel.exists({
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(productId),
    });

    return { inWishlist: !!exists };
  }

  private getCacheKey(userId: string): string {
    return `${this.WISHLIST_CACHE_PREFIX}${userId}`;
  }

  private async invalidateWishlistCache(userId: string): Promise<void> {
    const cacheKey = this.getCacheKey(userId);
    await this.redisService.del(cacheKey);
  }

  async removeWishlistItemsByProduct(productId: string): Promise<void> {
    await this.wishlistModel.deleteMany({ productId: new Types.ObjectId(productId) });
  }
}

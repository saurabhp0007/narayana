import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { RedisService } from '../../database/redis.service';
import { ProductService } from '../product/product.service';
import { OfferService } from '../offer/offer.service';
import { CartService } from '../cart/cart.service';
import { WishlistService } from '../wishlist/wishlist.service';
import {
  GuestAddToCartDto,
  GuestUpdateCartDto,
  GuestCheckoutDto,
} from './dto/guest.dto';
import { randomUUID } from 'crypto';

interface GuestCartItem {
  productId: string;
  quantity: number;
  addedAt: string;
}

interface GuestWishlistItem {
  productId: string;
  addedAt: string;
}

@Injectable()
export class GuestService {
  private readonly GUEST_CART_PREFIX = 'guest:cart:';
  private readonly GUEST_WISHLIST_PREFIX = 'guest:wishlist:';
  private readonly GUEST_TTL = 86400; // 24 hours = 1 day

  constructor(
    private redisService: RedisService,
    private productService: ProductService,
    private offerService: OfferService,
    private cartService: CartService,
    private wishlistService: WishlistService,
  ) {}

  generateGuestId(): string {
    return `guest_${randomUUID()}`;
  }

  // ==================== CART OPERATIONS ====================

  async addToCart(dto: GuestAddToCartDto): Promise<any> {
    const { guestId, productId, quantity = 1 } = dto;

    // Validate product exists and has stock
    const product = await this.productService.findOne(productId);

    if (!product.isActive) {
      throw new BadRequestException('Product is not available');
    }

    if (product.stock < quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`,
      );
    }

    // Get current cart from Redis
    const cartKey = this.getCartKey(guestId);
    const currentCart = await this.getGuestCartItems(guestId);

    // Check if product already in cart
    const existingItemIndex = currentCart.findIndex(
      (item) => item.productId === productId,
    );

    if (existingItemIndex !== -1) {
      const newQuantity = currentCart[existingItemIndex].quantity + quantity;

      if (product.stock < newQuantity) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${product.stock}, In cart: ${currentCart[existingItemIndex].quantity}`,
        );
      }

      currentCart[existingItemIndex].quantity = newQuantity;
    } else {
      currentCart.push({
        productId,
        quantity,
        addedAt: new Date().toISOString(),
      });
    }

    // Save to Redis with TTL
    await this.redisService.set(
      cartKey,
      JSON.stringify(currentCart),
      this.GUEST_TTL,
    );

    return { message: 'Item added to cart', guestId };
  }

  async getCart(guestId: string): Promise<any> {
    const cartItems = await this.getGuestCartItems(guestId);

    if (cartItems.length === 0) {
      return {
        items: [],
        summary: {
          subtotal: 0,
          totalProductDiscount: 0,
          totalOfferDiscount: 0,
          totalDiscount: 0,
          total: 0,
          totalItems: 0,
          itemCount: 0,
        },
      };
    }

    // Calculate totals with product details
    return this.calculateGuestCartTotals(cartItems);
  }

  async updateCartItem(dto: GuestUpdateCartDto): Promise<any> {
    const { guestId, productId, quantity } = dto;

    const product = await this.productService.findOne(productId);

    if (product.stock < quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`,
      );
    }

    const currentCart = await this.getGuestCartItems(guestId);
    const itemIndex = currentCart.findIndex(
      (item) => item.productId === productId,
    );

    if (itemIndex === -1) {
      throw new NotFoundException('Cart item not found');
    }

    currentCart[itemIndex].quantity = quantity;

    const cartKey = this.getCartKey(guestId);
    await this.redisService.set(
      cartKey,
      JSON.stringify(currentCart),
      this.GUEST_TTL,
    );

    return { message: 'Cart item updated', guestId };
  }

  async removeFromCart(guestId: string, productId: string): Promise<any> {
    const currentCart = await this.getGuestCartItems(guestId);
    const filteredCart = currentCart.filter(
      (item) => item.productId !== productId,
    );

    if (filteredCart.length === currentCart.length) {
      throw new NotFoundException('Cart item not found');
    }

    const cartKey = this.getCartKey(guestId);
    await this.redisService.set(
      cartKey,
      JSON.stringify(filteredCart),
      this.GUEST_TTL,
    );

    return { message: 'Item removed from cart', guestId };
  }

  async clearCart(guestId: string): Promise<any> {
    const cartKey = this.getCartKey(guestId);
    await this.redisService.del(cartKey);
    return { message: 'Cart cleared', guestId };
  }

  async getCartCount(guestId: string): Promise<{ count: number }> {
    const cartItems = await this.getGuestCartItems(guestId);
    const count = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    return { count };
  }

  // ==================== WISHLIST OPERATIONS ====================

  async addToWishlist(guestId: string, productId: string): Promise<any> {
    // Validate product exists
    await this.productService.findOne(productId);

    const wishlistKey = this.getWishlistKey(guestId);
    const currentWishlist = await this.getGuestWishlistItems(guestId);

    // Check if already in wishlist
    if (currentWishlist.some((item) => item.productId === productId)) {
      throw new BadRequestException('Product already in wishlist');
    }

    currentWishlist.push({
      productId,
      addedAt: new Date().toISOString(),
    });

    await this.redisService.set(
      wishlistKey,
      JSON.stringify(currentWishlist),
      this.GUEST_TTL,
    );

    return { message: 'Item added to wishlist', guestId };
  }

  async getWishlist(guestId: string): Promise<any> {
    const wishlistItems = await this.getGuestWishlistItems(guestId);

    if (wishlistItems.length === 0) {
      return { items: [], count: 0 };
    }

    // Get product details for each wishlist item
    const items = await Promise.all(
      wishlistItems.map(async (item) => {
        try {
          const product = await this.productService.findOne(item.productId);
          return {
            productId: item.productId,
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
            addedAt: item.addedAt,
          };
        } catch {
          return null;
        }
      }),
    );

    const validItems = items.filter((item) => item !== null);

    return {
      items: validItems,
      count: validItems.length,
    };
  }

  async removeFromWishlist(guestId: string, productId: string): Promise<any> {
    const currentWishlist = await this.getGuestWishlistItems(guestId);
    const filteredWishlist = currentWishlist.filter(
      (item) => item.productId !== productId,
    );

    if (filteredWishlist.length === currentWishlist.length) {
      throw new NotFoundException('Wishlist item not found');
    }

    const wishlistKey = this.getWishlistKey(guestId);
    await this.redisService.set(
      wishlistKey,
      JSON.stringify(filteredWishlist),
      this.GUEST_TTL,
    );

    return { message: 'Item removed from wishlist', guestId };
  }

  async clearWishlist(guestId: string): Promise<any> {
    const wishlistKey = this.getWishlistKey(guestId);
    await this.redisService.del(wishlistKey);
    return { message: 'Wishlist cleared', guestId };
  }

  async getWishlistCount(guestId: string): Promise<{ count: number }> {
    const wishlistItems = await this.getGuestWishlistItems(guestId);
    return { count: wishlistItems.length };
  }

  async checkInWishlist(
    guestId: string,
    productId: string,
  ): Promise<{ inWishlist: boolean }> {
    const wishlistItems = await this.getGuestWishlistItems(guestId);
    const inWishlist = wishlistItems.some(
      (item) => item.productId === productId,
    );
    return { inWishlist };
  }

  async moveWishlistToCart(guestId: string, productId: string): Promise<any> {
    // Add to cart
    await this.addToCart({ guestId, productId, quantity: 1 });

    // Remove from wishlist
    await this.removeFromWishlist(guestId, productId);

    return { message: 'Item moved to cart', guestId };
  }

  // ==================== CHECKOUT ====================

  async checkout(dto: GuestCheckoutDto): Promise<any> {
    const { guestId, customerDetails, shippingAddress, notes } = dto;

    // Get cart items
    const cart = await this.getCart(guestId);

    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Validate stock for all items
    for (const item of cart.items) {
      const product = await this.productService.findOne(item.productId);
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
        );
      }
    }

    // Generate order ID
    const orderId = `GO_${Date.now()}_${randomUUID().substring(0, 8).toUpperCase()}`;

    // Create order object
    const order = {
      orderId,
      guestId,
      customerDetails,
      shippingAddress,
      notes: notes || '',
      items: cart.items.map((item) => ({
        productId: item.productId,
        productName: item.product.name,
        sku: item.product.sku,
        quantity: item.quantity,
        price: item.price,
        itemTotal: item.itemTotal,
      })),
      summary: cart.summary,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // Store order in Redis (for 7 days)
    const orderKey = `guest:order:${orderId}`;
    await this.redisService.set(orderKey, JSON.stringify(order), 604800); // 7 days

    // Clear the cart after successful order
    await this.clearCart(guestId);

    return {
      message: 'Order placed successfully',
      orderId,
      orderDetails: order,
    };
  }

  // ==================== MERGE OPERATIONS ====================

  async mergeCartOnLogin(guestId: string, userId: string): Promise<any> {
    const guestCartItems = await this.getGuestCartItems(guestId);

    if (guestCartItems.length === 0) {
      return { message: 'No guest cart to merge' };
    }

    let mergedCount = 0;
    const errors: string[] = [];

    for (const guestItem of guestCartItems) {
      try {
        await this.cartService.addToCart(userId, {
          productId: guestItem.productId,
          quantity: guestItem.quantity,
        });
        mergedCount++;
      } catch (error) {
        errors.push(
          `Failed to merge product ${guestItem.productId}: ${error.message}`,
        );
      }
    }

    // Clear guest cart after merge
    await this.clearCart(guestId);

    return {
      message: `Merged ${mergedCount} items to user cart`,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  async mergeWishlistOnLogin(guestId: string, userId: string): Promise<any> {
    const guestWishlistItems = await this.getGuestWishlistItems(guestId);

    if (guestWishlistItems.length === 0) {
      return { message: 'No guest wishlist to merge' };
    }

    let mergedCount = 0;
    const errors: string[] = [];

    for (const guestItem of guestWishlistItems) {
      try {
        await this.wishlistService.addToWishlist(userId, {
          productId: guestItem.productId,
        });
        mergedCount++;
      } catch (error) {
        // Ignore conflict errors (item already in wishlist)
        if (error.status !== 409) {
          errors.push(
            `Failed to merge product ${guestItem.productId}: ${error.message}`,
          );
        }
      }
    }

    // Clear guest wishlist after merge
    await this.clearWishlist(guestId);

    return {
      message: `Merged ${mergedCount} items to user wishlist`,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  // ==================== PRIVATE HELPERS ====================

  private getCartKey(guestId: string): string {
    return `${this.GUEST_CART_PREFIX}${guestId}`;
  }

  private getWishlistKey(guestId: string): string {
    return `${this.GUEST_WISHLIST_PREFIX}${guestId}`;
  }

  private async getGuestCartItems(guestId: string): Promise<GuestCartItem[]> {
    const cartKey = this.getCartKey(guestId);
    const cartData = await this.redisService.get(cartKey);
    return cartData ? JSON.parse(cartData) : [];
  }

  private async getGuestWishlistItems(
    guestId: string,
  ): Promise<GuestWishlistItem[]> {
    const wishlistKey = this.getWishlistKey(guestId);
    const wishlistData = await this.redisService.get(wishlistKey);
    return wishlistData ? JSON.parse(wishlistData) : [];
  }

  private async calculateGuestCartTotals(
    cartItems: GuestCartItem[],
  ): Promise<any> {
    let subtotal = 0;
    let totalProductDiscount = 0;
    let totalOfferDiscount = 0;
    let total = 0;
    let totalItems = 0;

    // Resolve products first so offer discounts can be computed across the whole cart at once
    const resolvedItems = await Promise.all(
      cartItems.map(async (item) => {
        try {
          const product = await this.productService.findOne(item.productId);
          return { item, product };
        } catch {
          return null;
        }
      }),
    );
    const validResolved = resolvedItems.filter(
      (r): r is { item: GuestCartItem; product: any } => r !== null,
    );

    const { perProductDiscount, perProductOffer } = await this.offerService.computeCartOfferDiscounts(
      validResolved.map(({ item, product }) => ({
        productId: product._id.toString(),
        quantity: item.quantity,
        unitPrice: product.discountPrice || product.price,
      })),
    );

    const items = validResolved.map(({ item, product }) => {
      const originalPrice = product.price;
      const productDiscountPrice = product.discountPrice || product.price;
      const productDiscount = product.discountPrice
        ? (product.price - product.discountPrice) * item.quantity
        : 0;

      const offerDiscount = perProductDiscount[product._id.toString()] || 0;
      const offer = perProductOffer[product._id.toString()] || null;

      const finalPrice = productDiscountPrice * item.quantity - offerDiscount;

      subtotal += originalPrice * item.quantity;
      totalProductDiscount += productDiscount;
      totalOfferDiscount += offerDiscount;
      total += finalPrice;
      totalItems += item.quantity;

      return {
        productId: item.productId,
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
        price: productDiscountPrice,
        itemSubtotal: productDiscountPrice * item.quantity,
        productDiscount: productDiscount,
        offerDiscount: offerDiscount,
        itemTotal: finalPrice,
        appliedOffer: offer,
        addedAt: item.addedAt,
      };
    });

    const validItems = items.filter((item) => item !== null);

    return {
      items: validItems,
      summary: {
        subtotal,
        totalProductDiscount,
        totalOfferDiscount,
        totalDiscount: totalProductDiscount + totalOfferDiscount,
        total,
        totalItems,
        itemCount: validItems.length,
      },
    };
  }
}

import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GuestService } from './guest.service';
import {
  GuestAddToCartDto,
  GuestUpdateCartDto,
  GuestCartQueryDto,
  GuestAddToWishlistDto,
  GuestCheckoutDto,
} from './dto/guest.dto';

@ApiTags('Guest')
@Controller('guest')
export class GuestController {
  constructor(private readonly guestService: GuestService) {}

  // ==================== SESSION ====================

  @Post('session')
  @ApiOperation({ summary: 'Generate a new guest session ID' })
  @ApiResponse({ status: 201, description: 'Guest session ID generated' })
  generateSession() {
    const guestId = this.guestService.generateGuestId();
    return { guestId };
  }

  // ==================== CART OPERATIONS ====================

  @Post('cart')
  @ApiOperation({ summary: 'Add item to guest cart' })
  @ApiResponse({ status: 201, description: 'Item added to guest cart' })
  async addToCart(@Body() dto: GuestAddToCartDto) {
    return this.guestService.addToCart(dto);
  }

  @Get('cart')
  @ApiOperation({ summary: 'Get guest cart with product details' })
  @ApiResponse({ status: 200, description: 'Guest cart retrieved' })
  async getCart(@Query() query: GuestCartQueryDto) {
    return this.guestService.getCart(query.guestId);
  }

  @Get('cart/count')
  @ApiOperation({ summary: 'Get guest cart item count' })
  @ApiResponse({ status: 200, description: 'Guest cart count retrieved' })
  async getCartCount(@Query() query: GuestCartQueryDto) {
    return this.guestService.getCartCount(query.guestId);
  }

  @Patch('cart')
  @ApiOperation({ summary: 'Update guest cart item quantity' })
  @ApiResponse({ status: 200, description: 'Guest cart item updated' })
  async updateCartItem(@Body() dto: GuestUpdateCartDto) {
    return this.guestService.updateCartItem(dto);
  }

  @Delete('cart/:productId')
  @ApiOperation({ summary: 'Remove item from guest cart' })
  @ApiResponse({ status: 200, description: 'Item removed from guest cart' })
  async removeFromCart(
    @Param('productId') productId: string,
    @Query() query: GuestCartQueryDto,
    @Query('size') size?: string,
  ) {
    return this.guestService.removeFromCart(query.guestId, productId, size);
  }

  @Delete('cart')
  @ApiOperation({ summary: 'Clear guest cart' })
  @ApiResponse({ status: 200, description: 'Guest cart cleared' })
  async clearCart(@Query() query: GuestCartQueryDto) {
    return this.guestService.clearCart(query.guestId);
  }

  // ==================== WISHLIST OPERATIONS ====================

  @Post('wishlist')
  @ApiOperation({ summary: 'Add item to guest wishlist' })
  @ApiResponse({ status: 201, description: 'Item added to guest wishlist' })
  async addToWishlist(@Body() dto: GuestAddToWishlistDto) {
    return this.guestService.addToWishlist(dto.guestId, dto.productId);
  }

  @Get('wishlist')
  @ApiOperation({ summary: 'Get guest wishlist with product details' })
  @ApiResponse({ status: 200, description: 'Guest wishlist retrieved' })
  async getWishlist(@Query() query: GuestCartQueryDto) {
    return this.guestService.getWishlist(query.guestId);
  }

  @Get('wishlist/count')
  @ApiOperation({ summary: 'Get guest wishlist count' })
  @ApiResponse({ status: 200, description: 'Guest wishlist count retrieved' })
  async getWishlistCount(@Query() query: GuestCartQueryDto) {
    return this.guestService.getWishlistCount(query.guestId);
  }

  @Get('wishlist/check/:productId')
  @ApiOperation({ summary: 'Check if product is in guest wishlist' })
  @ApiResponse({ status: 200, description: 'Check result' })
  async checkInWishlist(
    @Param('productId') productId: string,
    @Query() query: GuestCartQueryDto,
  ) {
    return this.guestService.checkInWishlist(query.guestId, productId);
  }

  @Delete('wishlist/:productId')
  @ApiOperation({ summary: 'Remove item from guest wishlist' })
  @ApiResponse({
    status: 200,
    description: 'Item removed from guest wishlist',
  })
  async removeFromWishlist(
    @Param('productId') productId: string,
    @Query() query: GuestCartQueryDto,
  ) {
    return this.guestService.removeFromWishlist(query.guestId, productId);
  }

  @Delete('wishlist')
  @ApiOperation({ summary: 'Clear guest wishlist' })
  @ApiResponse({ status: 200, description: 'Guest wishlist cleared' })
  async clearWishlist(@Query() query: GuestCartQueryDto) {
    return this.guestService.clearWishlist(query.guestId);
  }

  @Post('wishlist/move-to-cart/:productId')
  @ApiOperation({ summary: 'Move item from wishlist to cart' })
  @ApiResponse({ status: 200, description: 'Item moved to cart' })
  async moveWishlistToCart(
    @Param('productId') productId: string,
    @Body() body: { guestId: string },
  ) {
    return this.guestService.moveWishlistToCart(body.guestId, productId);
  }

  // ==================== CHECKOUT ====================

  @Post('checkout')
  @ApiOperation({ summary: 'Process guest checkout' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  async checkout(@Body() dto: GuestCheckoutDto) {
    return this.guestService.checkout(dto);
  }
}

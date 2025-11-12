import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async addToWishlist(@Request() req, @Body() addToWishlistDto: AddToWishlistDto) {
    return this.wishlistService.addToWishlist(req.user.userId, addToWishlistDto);
  }

  @Get()
  async getWishlist(@Request() req) {
    return this.wishlistService.getWishlist(req.user.userId);
  }

  @Get('count')
  async getWishlistItemCount(@Request() req) {
    return this.wishlistService.getWishlistItemCount(req.user.userId);
  }

  @Get('check/:productId')
  async isInWishlist(@Request() req, @Param('productId') productId: string) {
    return this.wishlistService.isInWishlist(req.user.userId, productId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async removeFromWishlist(@Request() req, @Param('id') id: string) {
    return this.wishlistService.removeFromWishlist(req.user.userId, id);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  async clearWishlist(@Request() req) {
    return this.wishlistService.clearWishlist(req.user.userId);
  }
}

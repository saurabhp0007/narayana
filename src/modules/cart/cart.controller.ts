import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async addToCart(@Request() req, @Body() addToCartDto: AddToCartDto) {
    return this.cartService.addToCart(req.user.userId, addToCartDto);
  }

  @Get()
  async getCart(@Request() req) {
    return this.cartService.getCart(req.user.userId);
  }

  @Get('count')
  async getCartItemCount(@Request() req) {
    return this.cartService.getCartItemCount(req.user.userId);
  }

  @Patch(':id')
  async updateCartItem(
    @Request() req,
    @Param('id') id: string,
    @Body() updateCartDto: UpdateCartDto,
  ) {
    return this.cartService.updateCartItem(req.user.userId, id, updateCartDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async removeFromCart(@Request() req, @Param('id') id: string) {
    return this.cartService.removeFromCart(req.user.userId, id);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  async clearCart(@Request() req) {
    return this.cartService.clearCart(req.user.userId);
  }
}

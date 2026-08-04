import { Module } from '@nestjs/common';
import { GuestService } from './guest.service';
import { GuestController } from './guest.controller';
import { ProductModule } from '../product/product.module';
import { OfferModule } from '../offer/offer.module';
import { CartModule } from '../cart/cart.module';
import { WishlistModule } from '../wishlist/wishlist.module';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [ProductModule, OfferModule, CartModule, WishlistModule, OrderModule],
  controllers: [GuestController],
  providers: [GuestService],
  exports: [GuestService],
})
export class GuestModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AppController } from './app.controller';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { GenderModule } from './modules/gender/gender.module';
import { CategoryModule } from './modules/category/category.module';
import { ProductModule } from './modules/product/product.module';
import { MediaModule } from './modules/media/media.module';
import { CartModule } from './modules/cart/cart.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { EmailModule } from './modules/email/email.module';
import { OrderModule } from './modules/order/order.module';
import { OfferModule } from './modules/offer/offer.module';
import { FootwearSubcategoryModule } from './modules/footwear-subcategory/footwear-subcategory.module';
import { GuestModule } from './modules/guest/guest.module';
import { PaymentModule } from './modules/payment/payment.module';
import { ReviewModule } from './modules/review/review.module';
import { SettingsModule } from './modules/settings/settings.module';
import { HeroBannerModule } from './modules/hero-banner/hero-banner.module';
import { CollectionModule } from './modules/collection/collection.module';
import { ShopCategoryModule } from './modules/shop-category/shop-category.module';
import { ShopSubcategoryModule } from './modules/shop-subcategory/shop-subcategory.module';
import { SizeGroupModule } from './modules/size-group/size-group.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import emailConfig from './config/email.config';
import mediaConfig from './config/media.config';
import payuConfig from './config/payu.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, emailConfig, mediaConfig, payuConfig],
      envFilePath: '.env',
    }),
    DatabaseModule,
    AdminModule,
    AuthModule,
    UserModule,
    GenderModule,
    CategoryModule,
    ProductModule,
    MediaModule,
    CartModule,
    WishlistModule,
    EmailModule,
    OrderModule,
    OfferModule,
    FootwearSubcategoryModule,
    GuestModule,
    PaymentModule,
    ReviewModule,
    SettingsModule,
    HeroBannerModule,
    CollectionModule,
    ShopCategoryModule,
    ShopSubcategoryModule,
    SizeGroupModule,
    ShippingModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}

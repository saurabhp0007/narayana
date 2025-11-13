import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AppController } from './app.controller';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { GenderModule } from './modules/gender/gender.module';
import { CategoryModule } from './modules/category/category.module';
import { SubcategoryModule } from './modules/subcategory/subcategory.module';
import { ProductModule } from './modules/product/product.module';
import { MediaModule } from './modules/media/media.module';
import { CartModule } from './modules/cart/cart.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { EmailModule } from './modules/email/email.module';
import { OrderModule } from './modules/order/order.module';
import { OfferModule } from './modules/offer/offer.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import emailConfig from './config/email.config';
import imagekitConfig from './config/imagekit.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, emailConfig, imagekitConfig],
      envFilePath: '.env',
    }),
    DatabaseModule,
    AdminModule,
    AuthModule,
    UserModule,
    GenderModule,
    CategoryModule,
    SubcategoryModule,
    ProductModule,
    MediaModule,
    CartModule,
    WishlistModule,
    EmailModule,
    OrderModule,
    OfferModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}

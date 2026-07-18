import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HeroBannerService } from './hero-banner.service';
import { HeroBannerController } from './hero-banner.controller';
import { HeroBanner, HeroBannerSchema } from './schemas/hero-banner.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: HeroBanner.name, schema: HeroBannerSchema }])],
  controllers: [HeroBannerController],
  providers: [HeroBannerService],
  exports: [HeroBannerService],
})
export class HeroBannerModule {}

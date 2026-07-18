import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FootwearTabService } from './footwear-tab.service';
import { FootwearTabController } from './footwear-tab.controller';
import { FootwearTab, FootwearTabSchema } from './schemas/footwear-tab.schema';
import { Offer, OfferSchema } from '../offer/schemas/offer.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FootwearTab.name, schema: FootwearTabSchema },
      { name: Offer.name, schema: OfferSchema },
    ]),
  ],
  controllers: [FootwearTabController],
  providers: [FootwearTabService],
  exports: [FootwearTabService],
})
export class FootwearTabModule {}

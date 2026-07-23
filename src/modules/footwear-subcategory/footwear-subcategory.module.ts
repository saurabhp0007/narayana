import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FootwearSubcategoryService } from './footwear-subcategory.service';
import { FootwearSubcategoryController } from './footwear-subcategory.controller';
import { FootwearSubcategory, FootwearSubcategorySchema } from './schemas/footwear-subcategory.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: FootwearSubcategory.name, schema: FootwearSubcategorySchema }]),
  ],
  controllers: [FootwearSubcategoryController],
  providers: [FootwearSubcategoryService],
  exports: [FootwearSubcategoryService],
})
export class FootwearSubcategoryModule {}

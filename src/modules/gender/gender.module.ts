import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GenderService } from './gender.service';
import { GenderController } from './gender.controller';
import { Gender, GenderSchema } from './schemas/gender.schema';
import { CategoryModule } from '../category/category.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Gender.name, schema: GenderSchema }]),
    forwardRef(() => CategoryModule),
  ],
  controllers: [GenderController],
  providers: [GenderService],
  exports: [GenderService],
})
export class GenderModule {}

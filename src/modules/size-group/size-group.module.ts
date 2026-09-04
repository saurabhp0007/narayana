import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SizeGroupService } from './size-group.service';
import { SizeGroupController } from './size-group.controller';
import { SizeGroup, SizeGroupSchema } from './schemas/size-group.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: SizeGroup.name, schema: SizeGroupSchema }])],
  controllers: [SizeGroupController],
  providers: [SizeGroupService],
  exports: [SizeGroupService],
})
export class SizeGroupModule {}

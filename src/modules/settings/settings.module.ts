import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { HomepageSettings, HomepageSettingsSchema } from './schemas/homepage-settings.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: HomepageSettings.name, schema: HomepageSettingsSchema }])],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}

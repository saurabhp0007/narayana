import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HomepageSettings } from './schemas/homepage-settings.schema';
import { UpdateHomepageSettingsDto } from './dto/update-homepage-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(HomepageSettings.name)
    private homepageSettingsModel: Model<HomepageSettings>,
  ) {}

  async getHomepageSettings(): Promise<HomepageSettings> {
    let settings = await this.homepageSettingsModel.findOne().exec();
    if (!settings) {
      settings = await this.homepageSettingsModel.create({});
    }
    return settings;
  }

  async updateHomepageSettings(dto: UpdateHomepageSettingsDto): Promise<HomepageSettings> {
    const settings = await this.getHomepageSettings();
    Object.assign(settings, dto);
    return settings.save();
  }
}

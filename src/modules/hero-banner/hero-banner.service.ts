import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HeroBanner } from './schemas/hero-banner.schema';
import { CreateHeroBannerDto } from './dto/create-hero-banner.dto';
import { UpdateHeroBannerDto } from './dto/update-hero-banner.dto';

@Injectable()
export class HeroBannerService {
  constructor(
    @InjectModel(HeroBanner.name)
    private heroBannerModel: Model<HeroBanner>,
  ) {}

  async create(dto: CreateHeroBannerDto): Promise<HeroBanner> {
    const banner = new this.heroBannerModel(dto);
    return banner.save();
  }

  async findAll(): Promise<HeroBanner[]> {
    return this.heroBannerModel.find().sort({ displayOrder: 1, createdAt: -1 }).exec();
  }

  async findActive(): Promise<HeroBanner[]> {
    return this.heroBannerModel.find({ isActive: true }).sort({ displayOrder: 1, createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<HeroBanner> {
    const banner = await this.heroBannerModel.findById(id).exec();
    if (!banner) {
      throw new NotFoundException(`Hero banner with ID ${id} not found`);
    }
    return banner;
  }

  async update(id: string, dto: UpdateHeroBannerDto): Promise<HeroBanner> {
    const banner = await this.findOne(id);
    Object.assign(banner, dto);
    return banner.save();
  }

  async remove(id: string): Promise<{ message: string }> {
    const banner = await this.findOne(id);
    await banner.deleteOne();
    return { message: 'Hero banner deleted successfully' };
  }
}

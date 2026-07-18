import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FootwearTab } from './schemas/footwear-tab.schema';
import { Offer } from '../offer/schemas/offer.schema';
import { CreateFootwearTabDto } from './dto/create-footwear-tab.dto';
import { UpdateFootwearTabDto } from './dto/update-footwear-tab.dto';
import { generateSlug } from '../../common/utils/slug.util';

@Injectable()
export class FootwearTabService {
  constructor(
    @InjectModel(FootwearTab.name)
    private footwearTabModel: Model<FootwearTab>,
    @InjectModel(Offer.name)
    private offerModel: Model<Offer>,
  ) {}

  async create(createDto: CreateFootwearTabDto): Promise<FootwearTab> {
    const slug = createDto.slug || generateSlug(createDto.name);

    const existingByName = await this.footwearTabModel.findOne({ name: createDto.name });
    if (existingByName) {
      throw new ConflictException('A footwear tab with this name already exists');
    }

    const existingBySlug = await this.footwearTabModel.findOne({ slug });
    if (existingBySlug) {
      throw new ConflictException('A footwear tab with this slug already exists');
    }

    const tab = new this.footwearTabModel({ ...createDto, slug });
    return tab.save();
  }

  async findAll(isActive?: boolean): Promise<FootwearTab[]> {
    const filter: Record<string, unknown> = {};
    if (isActive !== undefined) filter.isActive = isActive;

    return this.footwearTabModel.find(filter).sort({ displayOrder: 1, createdAt: 1 }).exec();
  }

  async findOne(id: string): Promise<FootwearTab> {
    const tab = await this.footwearTabModel.findById(id).exec();
    if (!tab) {
      throw new NotFoundException(`Footwear tab with ID ${id} not found`);
    }
    return tab;
  }

  async update(id: string, updateDto: UpdateFootwearTabDto): Promise<FootwearTab> {
    const tab = await this.findOne(id);

    if (updateDto.name && updateDto.name !== tab.name) {
      const existingByName = await this.footwearTabModel.findOne({ name: updateDto.name, _id: { $ne: id } });
      if (existingByName) {
        throw new ConflictException('A footwear tab with this name already exists');
      }
    }

    if (updateDto.slug && updateDto.slug !== tab.slug) {
      const existingBySlug = await this.footwearTabModel.findOne({ slug: updateDto.slug, _id: { $ne: id } });
      if (existingBySlug) {
        throw new ConflictException('A footwear tab with this slug already exists');
      }
    }

    Object.assign(tab, updateDto);
    return tab.save();
  }

  async remove(id: string): Promise<{ message: string }> {
    const tab = await this.findOne(id);

    const offerCount = await this.offerModel.countDocuments({ footwearTabId: tab._id });
    if (offerCount > 0) {
      throw new BadRequestException(
        `Cannot delete tab. It has ${offerCount} offer(s) assigned to it. Reassign or remove them first.`,
      );
    }

    await tab.deleteOne();
    return { message: `Footwear tab ${tab.name} has been deleted successfully` };
  }
}

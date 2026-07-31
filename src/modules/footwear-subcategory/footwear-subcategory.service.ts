import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FootwearSubcategory } from './schemas/footwear-subcategory.schema';
import { CreateFootwearSubcategoryDto } from './dto/create-footwear-subcategory.dto';
import { UpdateFootwearSubcategoryDto } from './dto/update-footwear-subcategory.dto';
import { generateSlug } from '../../common/utils/slug.util';

const PRODUCT_POPULATE_FIELDS = 'name images price discountPrice badge sku';

@Injectable()
export class FootwearSubcategoryService {
  constructor(
    @InjectModel(FootwearSubcategory.name)
    private footwearSubcategoryModel: Model<FootwearSubcategory>,
  ) {}

  // Uniqueness is scoped per-tab: a name only conflicts with another subcategory that
  // shares at least one of the same tabs (querying tabNames with $in matches on overlap).
  private async ensureUnique(name: string, slug: string, tabNames: string[], excludeId?: string): Promise<void> {
    const idFilter = excludeId ? { _id: { $ne: excludeId } } : {};

    const existingByName = await this.footwearSubcategoryModel.findOne({
      name,
      tabNames: { $in: tabNames },
      ...idFilter,
    });
    if (existingByName) {
      throw new ConflictException('A subcategory with this name already exists in one of these tabs');
    }

    const existingBySlug = await this.footwearSubcategoryModel.findOne({ slug, ...idFilter });
    if (existingBySlug) {
      throw new ConflictException('A subcategory with this slug already exists');
    }
  }

  async create(dto: CreateFootwearSubcategoryDto): Promise<FootwearSubcategory> {
    const slug = dto.slug || generateSlug(dto.name);
    await this.ensureUnique(dto.name, slug, dto.tabNames);

    const subcategory = new this.footwearSubcategoryModel({
      ...dto,
      slug,
      productIds: dto.productIds?.map((id) => new Types.ObjectId(id)) || [],
    });
    return subcategory.save();
  }

  async findAll(isActive?: boolean, tabName?: string): Promise<FootwearSubcategory[]> {
    const filter: Record<string, unknown> = {};
    if (isActive !== undefined) filter.isActive = isActive;
    if (tabName) filter.tabNames = tabName; // matches docs whose tabNames array contains this tab

    return this.footwearSubcategoryModel
      .find(filter)
      .populate('productIds', PRODUCT_POPULATE_FIELDS)
      .sort({ displayOrder: 1, createdAt: 1 })
      .exec();
  }

  async findActive(): Promise<FootwearSubcategory[]> {
    return this.footwearSubcategoryModel
      .find({ isActive: true })
      .sort({ displayOrder: 1, createdAt: 1 })
      .exec();
  }

  async findOne(id: string): Promise<FootwearSubcategory> {
    const subcategory = await this.footwearSubcategoryModel
      .findById(id)
      .populate('productIds', PRODUCT_POPULATE_FIELDS)
      .exec();
    if (!subcategory) {
      throw new NotFoundException(`Footwear subcategory with ID ${id} not found`);
    }
    return subcategory;
  }

  async findBySlug(slug: string): Promise<FootwearSubcategory> {
    const subcategory = await this.footwearSubcategoryModel.findOne({ slug, isActive: true }).exec();
    if (!subcategory) {
      throw new NotFoundException(`Footwear subcategory with slug ${slug} not found`);
    }
    return subcategory;
  }

  async update(id: string, dto: UpdateFootwearSubcategoryDto): Promise<FootwearSubcategory> {
    const subcategory = await this.footwearSubcategoryModel.findById(id).exec();
    if (!subcategory) {
      throw new NotFoundException(`Footwear subcategory with ID ${id} not found`);
    }

    const nextName = dto.name ?? subcategory.name;
    const nextSlug = dto.slug ?? subcategory.slug;
    const nextTabNames = dto.tabNames ?? subcategory.tabNames;

    if (dto.name || dto.slug || dto.tabNames) {
      await this.ensureUnique(nextName, nextSlug, nextTabNames, id);
    }

    Object.assign(subcategory, {
      ...dto,
      ...(dto.productIds ? { productIds: dto.productIds.map((pid) => new Types.ObjectId(pid)) } : {}),
    });
    await subcategory.save();
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const subcategory = await this.footwearSubcategoryModel.findById(id).exec();
    if (!subcategory) {
      throw new NotFoundException(`Footwear subcategory with ID ${id} not found`);
    }
    await subcategory.deleteOne();
    return { message: `Footwear subcategory ${subcategory.name} has been deleted successfully` };
  }
}

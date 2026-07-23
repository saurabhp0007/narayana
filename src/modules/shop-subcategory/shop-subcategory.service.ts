import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ShopSubcategory } from './schemas/shop-subcategory.schema';
import { CreateShopSubcategoryDto } from './dto/create-shop-subcategory.dto';
import { UpdateShopSubcategoryDto } from './dto/update-shop-subcategory.dto';
import { generateSlug } from '../../common/utils/slug.util';

const PRODUCT_POPULATE_FIELDS = 'name images price discountPrice badge sku';
const TAB_POPULATE_FIELDS = 'name slug displayOrder isActive';

@Injectable()
export class ShopSubcategoryService {
  constructor(
    @InjectModel(ShopSubcategory.name)
    private shopSubcategoryModel: Model<ShopSubcategory>,
  ) {}

  private async ensureUnique(name: string, slug: string, shopCategoryId: string, excludeId?: string): Promise<void> {
    const idFilter = excludeId ? { _id: { $ne: excludeId } } : {};

    const existingByName = await this.shopSubcategoryModel.findOne({
      name,
      shopCategoryId,
      ...idFilter,
    });
    if (existingByName) {
      throw new ConflictException('A subcategory with this name already exists in this category');
    }

    const existingBySlug = await this.shopSubcategoryModel.findOne({ slug, ...idFilter });
    if (existingBySlug) {
      throw new ConflictException('A subcategory with this slug already exists');
    }
  }

  async create(dto: CreateShopSubcategoryDto): Promise<ShopSubcategory> {
    const slug = dto.slug || generateSlug(dto.name);
    await this.ensureUnique(dto.name, slug, dto.shopCategoryId);

    const subcategory = new this.shopSubcategoryModel({
      ...dto,
      slug,
      shopCategoryId: new Types.ObjectId(dto.shopCategoryId),
      productIds: dto.productIds?.map((id) => new Types.ObjectId(id)) || [],
    });
    return subcategory.save();
  }

  async findAll(isActive?: boolean, shopCategoryId?: string): Promise<ShopSubcategory[]> {
    const filter: Record<string, unknown> = {};
    if (isActive !== undefined) filter.isActive = isActive;
    if (shopCategoryId) filter.shopCategoryId = shopCategoryId;

    return this.shopSubcategoryModel
      .find(filter)
      .populate('productIds', PRODUCT_POPULATE_FIELDS)
      .populate('shopCategoryId', TAB_POPULATE_FIELDS)
      .sort({ shopCategoryId: 1, displayOrder: 1, createdAt: 1 })
      .exec();
  }

  async findActive(): Promise<ShopSubcategory[]> {
    const subcategories = await this.shopSubcategoryModel
      .find({ isActive: true })
      .populate('shopCategoryId', TAB_POPULATE_FIELDS)
      .sort({ displayOrder: 1, createdAt: 1 })
      .exec();

    // Only surface subcategories whose parent tab is populated and active
    return subcategories.filter((s) => {
      const tab = s.shopCategoryId as unknown as { isActive?: boolean } | null;
      return tab && typeof tab === 'object' && tab.isActive;
    });
  }

  async findOne(id: string): Promise<ShopSubcategory> {
    const subcategory = await this.shopSubcategoryModel
      .findById(id)
      .populate('productIds', PRODUCT_POPULATE_FIELDS)
      .populate('shopCategoryId', TAB_POPULATE_FIELDS)
      .exec();
    if (!subcategory) {
      throw new NotFoundException(`Shop subcategory with ID ${id} not found`);
    }
    return subcategory;
  }

  async findBySlug(slug: string): Promise<ShopSubcategory> {
    const subcategory = await this.shopSubcategoryModel.findOne({ slug, isActive: true }).exec();
    if (!subcategory) {
      throw new NotFoundException(`Shop subcategory with slug ${slug} not found`);
    }
    return subcategory;
  }

  async update(id: string, dto: UpdateShopSubcategoryDto): Promise<ShopSubcategory> {
    const subcategory = await this.shopSubcategoryModel.findById(id).exec();
    if (!subcategory) {
      throw new NotFoundException(`Shop subcategory with ID ${id} not found`);
    }

    const nextName = dto.name ?? subcategory.name;
    const nextSlug = dto.slug ?? subcategory.slug;
    const nextTabId = dto.shopCategoryId ?? subcategory.shopCategoryId.toString();

    if (dto.name || dto.slug || dto.shopCategoryId) {
      await this.ensureUnique(nextName, nextSlug, nextTabId, id);
    }

    Object.assign(subcategory, {
      ...dto,
      ...(dto.shopCategoryId ? { shopCategoryId: new Types.ObjectId(dto.shopCategoryId) } : {}),
      ...(dto.productIds ? { productIds: dto.productIds.map((pid) => new Types.ObjectId(pid)) } : {}),
    });
    await subcategory.save();
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const subcategory = await this.shopSubcategoryModel.findById(id).exec();
    if (!subcategory) {
      throw new NotFoundException(`Shop subcategory with ID ${id} not found`);
    }
    await subcategory.deleteOne();
    return { message: `Shop subcategory ${subcategory.name} has been deleted successfully` };
  }
}

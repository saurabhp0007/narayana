import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ShopCategory } from './schemas/shop-category.schema';
import { ShopSubcategory } from '../shop-subcategory/schemas/shop-subcategory.schema';
import { CreateShopCategoryDto } from './dto/create-shop-category.dto';
import { UpdateShopCategoryDto } from './dto/update-shop-category.dto';
import { generateSlug } from '../../common/utils/slug.util';

@Injectable()
export class ShopCategoryService {
  constructor(
    @InjectModel(ShopCategory.name)
    private shopCategoryModel: Model<ShopCategory>,
    @InjectModel(ShopSubcategory.name)
    private shopSubcategoryModel: Model<ShopSubcategory>,
  ) {}

  async create(dto: CreateShopCategoryDto): Promise<ShopCategory> {
    const slug = dto.slug || generateSlug(dto.name);

    const existingByName = await this.shopCategoryModel.findOne({ name: dto.name });
    if (existingByName) {
      throw new ConflictException('A shop category with this name already exists');
    }

    const existingBySlug = await this.shopCategoryModel.findOne({ slug });
    if (existingBySlug) {
      throw new ConflictException('A shop category with this slug already exists');
    }

    const shopCategory = new this.shopCategoryModel({ ...dto, slug });
    return shopCategory.save();
  }

  async findAll(isActive?: boolean): Promise<ShopCategory[]> {
    const filter: Record<string, unknown> = {};
    if (isActive !== undefined) filter.isActive = isActive;

    return this.shopCategoryModel.find(filter).sort({ displayOrder: 1, createdAt: -1 }).exec();
  }

  async findActive(): Promise<ShopCategory[]> {
    return this.shopCategoryModel.find({ isActive: true }).sort({ displayOrder: 1, createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<ShopCategory> {
    const shopCategory = await this.shopCategoryModel.findById(id).exec();
    if (!shopCategory) {
      throw new NotFoundException(`Shop category with ID ${id} not found`);
    }
    return shopCategory;
  }

  async update(id: string, dto: UpdateShopCategoryDto): Promise<ShopCategory> {
    const shopCategory = await this.shopCategoryModel.findById(id).exec();
    if (!shopCategory) {
      throw new NotFoundException(`Shop category with ID ${id} not found`);
    }

    if (dto.name && dto.name !== shopCategory.name) {
      const existingByName = await this.shopCategoryModel.findOne({ name: dto.name, _id: { $ne: id } });
      if (existingByName) {
        throw new ConflictException('A shop category with this name already exists');
      }
    }

    if (dto.slug && dto.slug !== shopCategory.slug) {
      const existingBySlug = await this.shopCategoryModel.findOne({ slug: dto.slug, _id: { $ne: id } });
      if (existingBySlug) {
        throw new ConflictException('A shop category with this slug already exists');
      }
    }

    Object.assign(shopCategory, dto);
    await shopCategory.save();
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const shopCategory = await this.shopCategoryModel.findById(id).exec();
    if (!shopCategory) {
      throw new NotFoundException(`Shop category with ID ${id} not found`);
    }

    const subcategoryCount = await this.shopSubcategoryModel.countDocuments({ shopCategoryId: shopCategory._id });
    if (subcategoryCount > 0) {
      throw new BadRequestException(
        `Cannot delete category. It has ${subcategoryCount} subcategory(ies) assigned to it. Reassign or remove them first.`,
      );
    }

    await shopCategory.deleteOne();
    return { message: `Shop category ${shopCategory.name} has been deleted successfully` };
  }
}

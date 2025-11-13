import { Injectable, NotFoundException, ConflictException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { GenderService } from '../gender/gender.service';
import { SubcategoryService } from '../subcategory/subcategory.service';
import { generateSlug } from '../../common/utils/slug.util';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name)
    private categoryModel: Model<Category>,
    @Inject(forwardRef(() => GenderService))
    private genderService: GenderService,
    @Inject(forwardRef(() => SubcategoryService))
    private subcategoryService: SubcategoryService,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    // Validate gender exists
    await this.genderService.findOne(createCategoryDto.genderId);

    // Generate slug if not provided
    const slug = createCategoryDto.slug || generateSlug(createCategoryDto.name);

    // Check for duplicate name within the same gender
    const existingByName = await this.categoryModel.findOne({
      name: createCategoryDto.name,
      genderId: createCategoryDto.genderId,
    });
    if (existingByName) {
      throw new ConflictException('Category with this name already exists for this gender');
    }

    // Check for duplicate slug within the same gender
    const existingBySlug = await this.categoryModel.findOne({
      slug,
      genderId: createCategoryDto.genderId,
    });
    if (existingBySlug) {
      throw new ConflictException('Category with this slug already exists for this gender');
    }

    const category = new this.categoryModel({
      ...createCategoryDto,
      slug,
      genderId: new Types.ObjectId(createCategoryDto.genderId),
    });

    return category.save();
  }

  async findAll(page: number = 1, limit: number = 10, genderId?: string, isActive?: boolean): Promise<any> {
    const skip = (page - 1) * limit;
    const filter: any = {};

    if (genderId) {
      filter.genderId = new Types.ObjectId(genderId);
    }

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      this.categoryModel
        .find(filter)
        .populate('genderId', 'name slug')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.categoryModel.countDocuments(filter),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryModel
      .findById(id)
      .populate('genderId', 'name slug')
      .exec();
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async findBySlug(slug: string, genderId?: string): Promise<Category> {
    const filter: any = { slug };
    if (genderId) {
      filter.genderId = new Types.ObjectId(genderId);
    }

    const category = await this.categoryModel
      .findOne(filter)
      .populate('genderId', 'name slug')
      .exec();
    if (!category) {
      throw new NotFoundException(`Category with slug ${slug} not found`);
    }
    return category;
  }

  async findByGender(genderId: string): Promise<Category[]> {
    // Validate gender exists
    await this.genderService.findOne(genderId);

    return this.categoryModel
      .find({ genderId: new Types.ObjectId(genderId), isActive: true })
      .sort({ name: 1 })
      .exec();
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    // If genderId is being updated, validate it exists
    if (updateCategoryDto.genderId) {
      await this.genderService.findOne(updateCategoryDto.genderId);
    }

    // If name is being updated, regenerate slug
    if (updateCategoryDto.name) {
      const newSlug = updateCategoryDto.slug || generateSlug(updateCategoryDto.name);
      const targetGenderId = updateCategoryDto.genderId || category.genderId;

      // Check for duplicate name (excluding current)
      const existingByName = await this.categoryModel.findOne({
        name: updateCategoryDto.name,
        genderId: targetGenderId,
        _id: { $ne: id },
      });
      if (existingByName) {
        throw new ConflictException('Category with this name already exists for this gender');
      }

      // Check for duplicate slug (excluding current)
      const existingBySlug = await this.categoryModel.findOne({
        slug: newSlug,
        genderId: targetGenderId,
        _id: { $ne: id },
      });
      if (existingBySlug) {
        throw new ConflictException('Category with this slug already exists for this gender');
      }

      updateCategoryDto.slug = newSlug;
    }

    Object.assign(category, updateCategoryDto);
    return category.save();
  }

  async remove(id: string): Promise<{ message: string }> {
    const category = await this.findOne(id);

    // Check if there are any subcategories using this category
    const subcategoryCount = await this.subcategoryService.countByCategory(id);
    if (subcategoryCount > 0) {
      throw new BadRequestException(
        `Cannot delete category. It has ${subcategoryCount} associated subcategory(ies). Please delete them first.`,
      );
    }

    await category.deleteOne();
    return { message: `Category ${category.name} has been deleted successfully` };
  }

  async countByGender(genderId: string): Promise<number> {
    return this.categoryModel.countDocuments({ genderId: new Types.ObjectId(genderId) });
  }

  async search(query: string, limit: number = 10): Promise<Category[]> {
    const searchRegex = new RegExp(query, 'i');
    return this.categoryModel
      .find({
        isActive: true,
        $or: [
          { name: { $regex: searchRegex } },
          { slug: { $regex: searchRegex } },
        ],
      })
      .select('_id name slug')
      .limit(limit)
      .exec();
  }
}

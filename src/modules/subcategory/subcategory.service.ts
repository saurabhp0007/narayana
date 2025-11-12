import { Injectable, NotFoundException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subcategory } from './schemas/subcategory.schema';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { CategoryService } from '../category/category.service';
import { generateSlug } from '../../common/utils/slug.util';

@Injectable()
export class SubcategoryService {
  constructor(
    @InjectModel(Subcategory.name)
    private subcategoryModel: Model<Subcategory>,
    @Inject(forwardRef(() => CategoryService))
    private categoryService: CategoryService,
  ) {}

  async create(createSubcategoryDto: CreateSubcategoryDto): Promise<Subcategory> {
    // Validate category exists
    await this.categoryService.findOne(createSubcategoryDto.categoryId);

    // Generate slug if not provided
    const slug = createSubcategoryDto.slug || generateSlug(createSubcategoryDto.name);

    // Check for duplicate name within the same category
    const existingByName = await this.subcategoryModel.findOne({
      name: createSubcategoryDto.name,
      categoryId: createSubcategoryDto.categoryId,
    });
    if (existingByName) {
      throw new ConflictException('Subcategory with this name already exists for this category');
    }

    // Check for duplicate slug within the same category
    const existingBySlug = await this.subcategoryModel.findOne({
      slug,
      categoryId: createSubcategoryDto.categoryId,
    });
    if (existingBySlug) {
      throw new ConflictException('Subcategory with this slug already exists for this category');
    }

    const subcategory = new this.subcategoryModel({
      ...createSubcategoryDto,
      slug,
      categoryId: new Types.ObjectId(createSubcategoryDto.categoryId),
    });

    return subcategory.save();
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    categoryId?: string,
    isActive?: boolean,
  ): Promise<any> {
    const skip = (page - 1) * limit;
    const filter: any = {};

    if (categoryId) {
      filter.categoryId = new Types.ObjectId(categoryId);
    }

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      this.subcategoryModel
        .find(filter)
        .populate({
          path: 'categoryId',
          select: 'name slug genderId',
          populate: {
            path: 'genderId',
            select: 'name slug',
          },
        })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.subcategoryModel.countDocuments(filter),
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

  async findOne(id: string): Promise<Subcategory> {
    const subcategory = await this.subcategoryModel
      .findById(id)
      .populate({
        path: 'categoryId',
        select: 'name slug genderId',
        populate: {
          path: 'genderId',
          select: 'name slug',
        },
      })
      .exec();
    if (!subcategory) {
      throw new NotFoundException(`Subcategory with ID ${id} not found`);
    }
    return subcategory;
  }

  async findBySlug(slug: string, categoryId?: string): Promise<Subcategory> {
    const filter: any = { slug };
    if (categoryId) {
      filter.categoryId = new Types.ObjectId(categoryId);
    }

    const subcategory = await this.subcategoryModel
      .findOne(filter)
      .populate({
        path: 'categoryId',
        select: 'name slug genderId',
        populate: {
          path: 'genderId',
          select: 'name slug',
        },
      })
      .exec();
    if (!subcategory) {
      throw new NotFoundException(`Subcategory with slug ${slug} not found`);
    }
    return subcategory;
  }

  async findByCategory(categoryId: string): Promise<Subcategory[]> {
    // Validate category exists
    await this.categoryService.findOne(categoryId);

    return this.subcategoryModel
      .find({ categoryId: new Types.ObjectId(categoryId), isActive: true })
      .sort({ name: 1 })
      .exec();
  }

  async update(id: string, updateSubcategoryDto: UpdateSubcategoryDto): Promise<Subcategory> {
    const subcategory = await this.findOne(id);

    // If categoryId is being updated, validate it exists
    if (updateSubcategoryDto.categoryId) {
      await this.categoryService.findOne(updateSubcategoryDto.categoryId);
    }

    // If name is being updated, regenerate slug
    if (updateSubcategoryDto.name) {
      const newSlug = updateSubcategoryDto.slug || generateSlug(updateSubcategoryDto.name);
      const targetCategoryId = updateSubcategoryDto.categoryId || subcategory.categoryId;

      // Check for duplicate name (excluding current)
      const existingByName = await this.subcategoryModel.findOne({
        name: updateSubcategoryDto.name,
        categoryId: targetCategoryId,
        _id: { $ne: id },
      });
      if (existingByName) {
        throw new ConflictException(
          'Subcategory with this name already exists for this category',
        );
      }

      // Check for duplicate slug (excluding current)
      const existingBySlug = await this.subcategoryModel.findOne({
        slug: newSlug,
        categoryId: targetCategoryId,
        _id: { $ne: id },
      });
      if (existingBySlug) {
        throw new ConflictException(
          'Subcategory with this slug already exists for this category',
        );
      }

      updateSubcategoryDto.slug = newSlug;
    }

    Object.assign(subcategory, updateSubcategoryDto);
    return subcategory.save();
  }

  async remove(id: string): Promise<{ message: string }> {
    const subcategory = await this.findOne(id);

    // Check if there are any products using this subcategory
    // This will be implemented when Product module is ready
    // For now, we'll just delete

    await subcategory.deleteOne();
    return { message: `Subcategory ${subcategory.name} has been deleted successfully` };
  }

  async countByCategory(categoryId: string): Promise<number> {
    return this.subcategoryModel.countDocuments({ categoryId: new Types.ObjectId(categoryId) });
  }
}

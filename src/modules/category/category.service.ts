import { Injectable, NotFoundException, ConflictException, BadRequestException, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { GenderService } from '../gender/gender.service';
import { RedisService } from '../../database/redis.service';
import { generateSlug } from '../../common/utils/slug.util';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);
  private readonly CACHE_PREFIX = 'category:';
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly MAX_LATEST_ARRIVALS_CATEGORIES = 4;

  constructor(
    @InjectModel(Category.name)
    private categoryModel: Model<Category>,
    @Inject(forwardRef(() => GenderService))
    private genderService: GenderService,
    private redisService: RedisService,
  ) {}

  private async assertLatestArrivalsCapacity(excludeId?: string): Promise<void> {
    const filter: any = { showInLatestArrivals: true };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    const count = await this.categoryModel.countDocuments(filter);
    if (count >= this.MAX_LATEST_ARRIVALS_CATEGORIES) {
      throw new BadRequestException(
        `Only ${this.MAX_LATEST_ARRIVALS_CATEGORIES} categories can be shown in Latest Arrivals at a time. Turn one off before enabling another.`,
      );
    }
  }

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    // Validate gender exists
    await this.genderService.findOne(createCategoryDto.genderId);

    if (createCategoryDto.showInLatestArrivals) {
      await this.assertLatestArrivalsCapacity();
    }

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

    const savedCategory = await category.save();

    // Invalidate cache
    await this.invalidateCache();

    return savedCategory;
  }

  private async invalidateCache(): Promise<void> {
    try {
      const keys = await this.redisService.keys(`${this.CACHE_PREFIX}*`);
      for (const key of keys) {
        await this.redisService.del(key);
      }
      this.logger.log('Category cache invalidated');
    } catch (error) {
      this.logger.error('Failed to invalidate cache:', error);
    }
  }

  async findAll(page: number = 1, limit: number = 10, genderId?: string, isActive?: boolean): Promise<any> {
    const cacheKey = `${this.CACHE_PREFIX}all:${page}:${limit}:${genderId || 'all'}:${isActive !== undefined ? isActive : 'all'}`;

    // Try to get from cache first
    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        this.logger.log(`Cache hit for ${cacheKey}`);
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.error('Cache read error:', error);
    }

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

    const result = {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Cache the result
    try {
      await this.redisService.set(cacheKey, JSON.stringify(result), this.CACHE_TTL);
      this.logger.log(`Cached ${cacheKey}`);
    } catch (error) {
      this.logger.error('Cache write error:', error);
    }

    return result;
  }

  async findOne(id: string): Promise<Category> {
    const cacheKey = `${this.CACHE_PREFIX}id:${id}`;

    // Try to get from cache first
    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        this.logger.log(`Cache hit for ${cacheKey}`);
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.error('Cache read error:', error);
    }

    const category = await this.categoryModel
      .findById(id)
      .populate('genderId', 'name slug')
      .exec();
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Cache the result
    try {
      await this.redisService.set(cacheKey, JSON.stringify(category), this.CACHE_TTL);
      this.logger.log(`Cached ${cacheKey}`);
    } catch (error) {
      this.logger.error('Cache write error:', error);
    }

    return category;
  }

  // Always hits Mongo directly, bypassing the Redis cache — mutations need a live
  // Mongoose document (for .save()/.deleteOne()), which a JSON.parse'd cache hit is not.
  private async getDocumentOrThrow(id: string): Promise<Category> {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async findBySlug(slug: string, genderId?: string): Promise<Category> {
    const cacheKey = `${this.CACHE_PREFIX}slug:${slug}:${genderId || 'all'}`;

    // Try to get from cache first
    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        this.logger.log(`Cache hit for ${cacheKey}`);
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.error('Cache read error:', error);
    }

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

    // Cache the result
    try {
      await this.redisService.set(cacheKey, JSON.stringify(category), this.CACHE_TTL);
      this.logger.log(`Cached ${cacheKey}`);
    } catch (error) {
      this.logger.error('Cache write error:', error);
    }

    return category;
  }

  async findByGender(genderId: string): Promise<Category[]> {
    const cacheKey = `${this.CACHE_PREFIX}gender:${genderId}`;

    // Try to get from cache first
    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        this.logger.log(`Cache hit for ${cacheKey}`);
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.error('Cache read error:', error);
    }

    // Validate gender exists
    await this.genderService.findOne(genderId);

    const categories = await this.categoryModel
      .find({ genderId: new Types.ObjectId(genderId), isActive: true })
      .sort({ displayOrder: 1, name: 1 })
      .exec();

    // Cache the result
    try {
      await this.redisService.set(cacheKey, JSON.stringify(categories), this.CACHE_TTL);
      this.logger.log(`Cached ${cacheKey}`);
    } catch (error) {
      this.logger.error('Cache write error:', error);
    }

    return categories;
  }

  async findByTabGroup(tabGroup: string): Promise<Category[]> {
    const cacheKey = `${this.CACHE_PREFIX}tabgroup:${tabGroup}`;

    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.error('Cache read error:', error);
    }

    const categories = await this.categoryModel
      .find({ tabGroup, isActive: true })
      .populate('genderId', 'name slug')
      .sort({ displayOrder: 1, name: 1 })
      .exec();

    try {
      await this.redisService.set(cacheKey, JSON.stringify(categories), this.CACHE_TTL);
    } catch (error) {
      this.logger.error('Cache write error:', error);
    }

    return categories;
  }

  async findLatestArrivalsCategories(): Promise<Category[]> {
    const cacheKey = `${this.CACHE_PREFIX}latest-arrivals`;

    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.error('Cache read error:', error);
    }

    const categories = await this.categoryModel
      .find({ showInLatestArrivals: true, isActive: true })
      .populate('genderId', 'name slug')
      .sort({ displayOrder: 1, name: 1 })
      .limit(this.MAX_LATEST_ARRIVALS_CATEGORIES)
      .exec();

    try {
      await this.redisService.set(cacheKey, JSON.stringify(categories), this.CACHE_TTL);
    } catch (error) {
      this.logger.error('Cache write error:', error);
    }

    return categories;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.getDocumentOrThrow(id);

    // If genderId is being updated, validate it exists
    if (updateCategoryDto.genderId) {
      await this.genderService.findOne(updateCategoryDto.genderId);
    }

    // Only re-check capacity when the flag is being turned on for a category that wasn't already on
    if (updateCategoryDto.showInLatestArrivals && !category.showInLatestArrivals) {
      await this.assertLatestArrivalsCapacity(id);
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
    const savedCategory = await category.save();

    // Invalidate cache
    await this.invalidateCache();

    return savedCategory;
  }

  async remove(id: string): Promise<{ message: string }> {
    const category = await this.getDocumentOrThrow(id);

    await category.deleteOne();

    // Invalidate cache
    await this.invalidateCache();

    return { message: `Category ${category.name} has been deleted successfully` };
  }

  async countByGender(genderId: string): Promise<number> {
    return this.categoryModel.countDocuments({ genderId: new Types.ObjectId(genderId) });
  }

  /**
   * Find all categories with an exact (case-insensitive) name match, across all genders.
   * Used to filter products by a human-readable category name (e.g. "Shoes") without
   * needing to know the per-gender categoryId.
   */
  async findAllByName(name: string): Promise<Category[]> {
    const escaped = name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.categoryModel
      .find({ name: { $regex: `^${escaped}$`, $options: 'i' }, isActive: true })
      .exec();
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

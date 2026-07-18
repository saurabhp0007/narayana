import { Injectable, NotFoundException, ConflictException, BadRequestException, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Gender } from './schemas/gender.schema';
import { CreateGenderDto } from './dto/create-gender.dto';
import { UpdateGenderDto } from './dto/update-gender.dto';
import { CategoryService } from '../category/category.service';
import { RedisService } from '../../database/redis.service';
import { generateSlug } from '../../common/utils/slug.util';

@Injectable()
export class GenderService {
  private readonly logger = new Logger(GenderService.name);
  private readonly CACHE_PREFIX = 'gender:';
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    @InjectModel(Gender.name)
    private genderModel: Model<Gender>,
    @Inject(forwardRef(() => CategoryService))
    private categoryService: CategoryService,
    private redisService: RedisService,
  ) {}

  private async invalidateCache(): Promise<void> {
    try {
      const keys = await this.redisService.keys(`${this.CACHE_PREFIX}*`);
      for (const key of keys) {
        await this.redisService.del(key);
      }
      this.logger.log('Gender cache invalidated');
    } catch (error) {
      this.logger.error('Failed to invalidate cache:', error);
    }
  }

  async create(createGenderDto: CreateGenderDto): Promise<Gender> {
    // Generate slug if not provided
    const slug = createGenderDto.slug || generateSlug(createGenderDto.name);

    // Check for duplicate name
    const existingByName = await this.genderModel.findOne({
      name: createGenderDto.name
    });
    if (existingByName) {
      throw new ConflictException('Gender with this name already exists');
    }

    // Check for duplicate slug
    const existingBySlug = await this.genderModel.findOne({ slug });
    if (existingBySlug) {
      throw new ConflictException('Gender with this slug already exists');
    }

    const gender = new this.genderModel({
      ...createGenderDto,
      slug,
    });

    const savedGender = await gender.save();
    await this.invalidateCache();
    return savedGender;
  }

  async findAll(page: number = 1, limit: number = 10, isActive?: boolean): Promise<any> {
    const cacheKey = `${this.CACHE_PREFIX}all:${page}:${limit}:${isActive !== undefined ? isActive : 'all'}`;

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

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      this.genderModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.genderModel.countDocuments(filter),
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

  async findOne(id: string): Promise<Gender> {
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

    const gender = await this.genderModel.findById(id).exec();
    if (!gender) {
      throw new NotFoundException(`Gender with ID ${id} not found`);
    }

    // Cache the result
    try {
      await this.redisService.set(cacheKey, JSON.stringify(gender), this.CACHE_TTL);
      this.logger.log(`Cached ${cacheKey}`);
    } catch (error) {
      this.logger.error('Cache write error:', error);
    }

    return gender;
  }

  // Always hits Mongo directly, bypassing the Redis cache — mutations need a live
  // Mongoose document (for .save()/.deleteOne()), which a JSON.parse'd cache hit is not.
  private async getDocumentOrThrow(id: string): Promise<Gender> {
    const gender = await this.genderModel.findById(id).exec();
    if (!gender) {
      throw new NotFoundException(`Gender with ID ${id} not found`);
    }
    return gender;
  }

  async findBySlug(slug: string): Promise<Gender> {
    const cacheKey = `${this.CACHE_PREFIX}slug:${slug}`;

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

    const gender = await this.genderModel.findOne({ slug }).exec();
    if (!gender) {
      throw new NotFoundException(`Gender with slug ${slug} not found`);
    }

    // Cache the result
    try {
      await this.redisService.set(cacheKey, JSON.stringify(gender), this.CACHE_TTL);
      this.logger.log(`Cached ${cacheKey}`);
    } catch (error) {
      this.logger.error('Cache write error:', error);
    }

    return gender;
  }

  async update(id: string, updateGenderDto: UpdateGenderDto): Promise<Gender> {
    const gender = await this.getDocumentOrThrow(id);

    // If name is being updated, regenerate slug
    if (updateGenderDto.name) {
      const newSlug = updateGenderDto.slug || generateSlug(updateGenderDto.name);

      // Check for duplicate name (excluding current)
      const existingByName = await this.genderModel.findOne({
        name: updateGenderDto.name,
        _id: { $ne: id },
      });
      if (existingByName) {
        throw new ConflictException('Gender with this name already exists');
      }

      // Check for duplicate slug (excluding current)
      const existingBySlug = await this.genderModel.findOne({
        slug: newSlug,
        _id: { $ne: id },
      });
      if (existingBySlug) {
        throw new ConflictException('Gender with this slug already exists');
      }

      updateGenderDto.slug = newSlug;
    }

    Object.assign(gender, updateGenderDto);
    const savedGender = await gender.save();
    await this.invalidateCache();
    return savedGender;
  }

  async remove(id: string): Promise<{ message: string }> {
    const gender = await this.getDocumentOrThrow(id);

    // Check if there are any categories using this gender
    const categoryCount = await this.categoryService.countByGender(id);
    if (categoryCount > 0) {
      throw new BadRequestException(
        `Cannot delete gender. It has ${categoryCount} associated category(ies). Please delete them first.`,
      );
    }

    await gender.deleteOne();
    await this.invalidateCache();
    return { message: `Gender ${gender.name} has been deleted successfully` };
  }

  async checkIfUsedByCategories(genderId: string): Promise<boolean> {
    const count = await this.categoryService.countByGender(genderId);
    return count > 0;
  }
}

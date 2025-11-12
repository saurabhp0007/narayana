import { Injectable, NotFoundException, ConflictException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Gender } from './schemas/gender.schema';
import { CreateGenderDto } from './dto/create-gender.dto';
import { UpdateGenderDto } from './dto/update-gender.dto';
import { CategoryService } from '../category/category.service';
import { generateSlug } from '../../common/utils/slug.util';

@Injectable()
export class GenderService {
  constructor(
    @InjectModel(Gender.name)
    private genderModel: Model<Gender>,
    @Inject(forwardRef(() => CategoryService))
    private categoryService: CategoryService,
  ) {}

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

    return gender.save();
  }

  async findAll(page: number = 1, limit: number = 10, isActive?: boolean): Promise<any> {
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

  async findOne(id: string): Promise<Gender> {
    const gender = await this.genderModel.findById(id).exec();
    if (!gender) {
      throw new NotFoundException(`Gender with ID ${id} not found`);
    }
    return gender;
  }

  async findBySlug(slug: string): Promise<Gender> {
    const gender = await this.genderModel.findOne({ slug }).exec();
    if (!gender) {
      throw new NotFoundException(`Gender with slug ${slug} not found`);
    }
    return gender;
  }

  async update(id: string, updateGenderDto: UpdateGenderDto): Promise<Gender> {
    const gender = await this.findOne(id);

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
    return gender.save();
  }

  async remove(id: string): Promise<{ message: string }> {
    const gender = await this.findOne(id);

    // Check if there are any categories using this gender
    const categoryCount = await this.categoryService.countByGender(id);
    if (categoryCount > 0) {
      throw new BadRequestException(
        `Cannot delete gender. It has ${categoryCount} associated category(ies). Please delete them first.`,
      );
    }

    await gender.deleteOne();
    return { message: `Gender ${gender.name} has been deleted successfully` };
  }

  async checkIfUsedByCategories(genderId: string): Promise<boolean> {
    const count = await this.categoryService.countByGender(genderId);
    return count > 0;
  }
}

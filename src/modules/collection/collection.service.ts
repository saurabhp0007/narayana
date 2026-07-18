import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Collection } from './schemas/collection.schema';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { generateSlug } from '../../common/utils/slug.util';

const PRODUCT_POPULATE_FIELDS = 'name images price discountPrice badge sku';

@Injectable()
export class CollectionService {
  constructor(
    @InjectModel(Collection.name)
    private collectionModel: Model<Collection>,
  ) {}

  async create(dto: CreateCollectionDto): Promise<Collection> {
    const slug = dto.slug || generateSlug(dto.name);

    const existingByName = await this.collectionModel.findOne({ name: dto.name });
    if (existingByName) {
      throw new ConflictException('A collection with this name already exists');
    }

    const existingBySlug = await this.collectionModel.findOne({ slug });
    if (existingBySlug) {
      throw new ConflictException('A collection with this slug already exists');
    }

    const collection = new this.collectionModel({ ...dto, slug });
    return collection.save();
  }

  async findAll(isActive?: boolean): Promise<Collection[]> {
    const filter: Record<string, unknown> = {};
    if (isActive !== undefined) filter.isActive = isActive;

    return this.collectionModel
      .find(filter)
      .populate('productIds', PRODUCT_POPULATE_FIELDS)
      .sort({ displayOrder: 1, createdAt: -1 })
      .exec();
  }

  async findActive(): Promise<Collection[]> {
    return this.collectionModel
      .find({ isActive: true })
      .populate('productIds', PRODUCT_POPULATE_FIELDS)
      .sort({ displayOrder: 1, createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Collection> {
    const collection = await this.collectionModel.findById(id).populate('productIds', PRODUCT_POPULATE_FIELDS).exec();
    if (!collection) {
      throw new NotFoundException(`Collection with ID ${id} not found`);
    }
    return collection;
  }

  async update(id: string, dto: UpdateCollectionDto): Promise<Collection> {
    const collection = await this.collectionModel.findById(id).exec();
    if (!collection) {
      throw new NotFoundException(`Collection with ID ${id} not found`);
    }

    if (dto.name && dto.name !== collection.name) {
      const existingByName = await this.collectionModel.findOne({ name: dto.name, _id: { $ne: id } });
      if (existingByName) {
        throw new ConflictException('A collection with this name already exists');
      }
    }

    if (dto.slug && dto.slug !== collection.slug) {
      const existingBySlug = await this.collectionModel.findOne({ slug: dto.slug, _id: { $ne: id } });
      if (existingBySlug) {
        throw new ConflictException('A collection with this slug already exists');
      }
    }

    Object.assign(collection, dto);
    await collection.save();
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const collection = await this.collectionModel.findById(id).exec();
    if (!collection) {
      throw new NotFoundException(`Collection with ID ${id} not found`);
    }
    await collection.deleteOne();
    return { message: `Collection ${collection.name} has been deleted successfully` };
  }
}

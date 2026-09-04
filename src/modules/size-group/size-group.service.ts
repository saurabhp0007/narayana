import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SizeGroup } from './schemas/size-group.schema';
import { CreateSizeGroupDto } from './dto/create-size-group.dto';
import { UpdateSizeGroupDto } from './dto/update-size-group.dto';
import { SIZE_GROUP_SEEDS } from './size-group.seed';

@Injectable()
export class SizeGroupService implements OnModuleInit {
  private readonly logger = new Logger(SizeGroupService.name);

  constructor(
    @InjectModel(SizeGroup.name)
    private sizeGroupModel: Model<SizeGroup>,
  ) {}

  async onModuleInit(): Promise<void> {
    for (const seed of SIZE_GROUP_SEEDS) {
      const exists = await this.sizeGroupModel.exists({ key: seed.key });
      if (!exists) {
        await this.sizeGroupModel.create(seed);
        this.logger.log(`Seeded size group ${seed.key}`);
      }
    }
  }

  async findAll(onlyActive = false): Promise<SizeGroup[]> {
    const filter = onlyActive ? { isActive: true } : {};
    return this.sizeGroupModel.find(filter).sort({ displayOrder: 1, name: 1 }).exec();
  }

  async findOne(id: string): Promise<SizeGroup> {
    const group = await this.sizeGroupModel.findById(id).exec();
    if (!group) {
      throw new NotFoundException(`Size group with ID ${id} not found`);
    }
    return group;
  }

  async create(dto: CreateSizeGroupDto): Promise<SizeGroup> {
    const key = dto.key.trim().toUpperCase();
    const existing = await this.sizeGroupModel.findOne({ key }).exec();
    if (existing) {
      throw new ConflictException(`Size group with key ${key} already exists`);
    }
    return this.sizeGroupModel.create({
      ...dto,
      key,
      sizes: this.normalizeSizes(dto.sizes || []),
    });
  }

  async update(id: string, dto: UpdateSizeGroupDto): Promise<SizeGroup> {
    const group = await this.findOne(id);

    if (dto.key && dto.key.trim().toUpperCase() !== group.key) {
      const key = dto.key.trim().toUpperCase();
      const clash = await this.sizeGroupModel.findOne({ key, _id: { $ne: id } }).exec();
      if (clash) {
        throw new ConflictException(`Size group with key ${key} already exists`);
      }
      group.key = key;
    }

    if (dto.name !== undefined) group.name = dto.name;
    if (dto.measurement !== undefined) group.measurement = dto.measurement;
    if (dto.recommendedUse !== undefined) group.recommendedUse = dto.recommendedUse;
    if (dto.displayOrder !== undefined) group.displayOrder = dto.displayOrder;
    if (dto.isActive !== undefined) group.isActive = dto.isActive;
    if (dto.sizes !== undefined) group.sizes = this.normalizeSizes(dto.sizes);

    return group.save();
  }

  async remove(id: string): Promise<{ message: string }> {
    const group = await this.findOne(id);
    await group.deleteOne();
    return { message: `Size group ${group.name} has been deleted successfully` };
  }

  async addSize(id: string, rawSize: string): Promise<SizeGroup> {
    const group = await this.findOne(id);
    const size = rawSize.trim();
    if (!size) {
      throw new BadRequestException('Size cannot be empty');
    }
    if (group.sizes.some((s) => s.toLowerCase() === size.toLowerCase())) {
      throw new ConflictException(`Size "${size}" already exists in ${group.name}`);
    }
    group.sizes.push(size);
    return group.save();
  }

  async removeSize(id: string, rawSize: string): Promise<SizeGroup> {
    const group = await this.findOne(id);
    const size = rawSize.trim();
    const next = group.sizes.filter((s) => s.toLowerCase() !== size.toLowerCase());
    if (next.length === group.sizes.length) {
      throw new NotFoundException(`Size "${size}" not found in ${group.name}`);
    }
    group.sizes = next;
    return group.save();
  }

  async getAllowedSizes(): Promise<Set<string>> {
    const groups = await this.sizeGroupModel.find({ isActive: true }).select('sizes').exec();
    const allowed = new Set<string>();
    for (const group of groups) {
      for (const size of group.sizes) {
        allowed.add(size.trim().toLowerCase());
      }
    }
    return allowed;
  }

  private normalizeSizes(sizes: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const raw of sizes) {
      const size = raw.trim();
      if (!size) continue;
      const lower = size.toLowerCase();
      if (seen.has(lower)) continue;
      seen.add(lower);
      result.push(size);
    }
    return result;
  }
}

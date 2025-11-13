import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GenderService } from '../gender/gender.service';
import { CategoryService } from '../category/category.service';
import { SubcategoryService } from '../subcategory/subcategory.service';
import { generateSKU } from '../../common/utils/sku.util';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)
    private productModel: Model<Product>,
    private genderService: GenderService,
    private categoryService: CategoryService,
    private subcategoryService: SubcategoryService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Validate relationships exist
    const [gender, category, subcategory] = await Promise.all([
      this.genderService.findOne(createProductDto.genderId),
      this.categoryService.findOne(createProductDto.categoryId),
      this.subcategoryService.findOne(createProductDto.subcategoryId),
    ]);

    // Validate discount price is less than price
    if (createProductDto.discountPrice && createProductDto.discountPrice >= createProductDto.price) {
      throw new BadRequestException('Discount price must be less than the regular price');
    }

    // Generate SKU if not provided
    let sku = createProductDto.sku;
    if (!sku) {
      sku = await this.generateUniqueSKU(gender.name, category.name);
    } else {
      // Check if custom SKU already exists
      const existingSKU = await this.productModel.findOne({ sku: sku.toUpperCase() });
      if (existingSKU) {
        throw new ConflictException(`Product with SKU ${sku} already exists`);
      }
      sku = sku.toUpperCase();
    }

    // Validate related product IDs exist
    if (createProductDto.relatedProductIds && createProductDto.relatedProductIds.length > 0) {
      await this.validateRelatedProducts(createProductDto.relatedProductIds);
    }

    const product = new this.productModel({
      ...createProductDto,
      sku,
      familySKU: createProductDto.familySKU?.toUpperCase(),
      genderId: new Types.ObjectId(createProductDto.genderId),
      categoryId: new Types.ObjectId(createProductDto.categoryId),
      subcategoryId: new Types.ObjectId(createProductDto.subcategoryId),
      relatedProductIds: createProductDto.relatedProductIds?.map((id) => new Types.ObjectId(id)),
    });

    return product.save();
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: {
      genderId?: string;
      categoryId?: string;
      subcategoryId?: string;
      minPrice?: number;
      maxPrice?: number;
      underPriceAmount?: number;
      inStock?: boolean;
      isActive?: boolean;
      search?: string;
      familySKU?: string;
    },
  ): Promise<any> {
    const skip = (page - 1) * limit;
    const filter: any = {};

    // Apply filters
    if (filters?.genderId) {
      filter.genderId = new Types.ObjectId(filters.genderId);
    }
    if (filters?.categoryId) {
      filter.categoryId = new Types.ObjectId(filters.categoryId);
    }
    if (filters?.subcategoryId) {
      filter.subcategoryId = new Types.ObjectId(filters.subcategoryId);
    }
    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
      filter.price = {};
      if (filters.minPrice !== undefined) {
        filter.price.$gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        filter.price.$lte = filters.maxPrice;
      }
    }
    if (filters?.underPriceAmount !== undefined) {
      filter.price = { ...filter.price, $lte: filters.underPriceAmount };
    }
    if (filters?.inStock === true) {
      filter.stock = { $gt: 0 };
    }
    if (filters?.isActive !== undefined) {
      filter.isActive = filters.isActive;
    }
    if (filters?.search) {
      filter.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { sku: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }
    if (filters?.familySKU) {
      filter.familySKU = filters.familySKU.toUpperCase();
    }

    const [data, total] = await Promise.all([
      this.productModel
        .find(filter)
        .populate('genderId', 'name slug')
        .populate('categoryId', 'name slug')
        .populate('subcategoryId', 'name slug')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.productModel.countDocuments(filter),
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

  async findOne(id: string): Promise<Product> {
    const product = await this.productModel
      .findById(id)
      .populate('genderId', 'name slug')
      .populate('categoryId', 'name slug')
      .populate('subcategoryId', 'name slug')
      .populate('relatedProductIds', 'name sku price discountPrice images')
      .exec();

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async findBySKU(sku: string): Promise<Product> {
    const product = await this.productModel
      .findOne({ sku: sku.toUpperCase() })
      .populate('genderId', 'name slug')
      .populate('categoryId', 'name slug')
      .populate('subcategoryId', 'name slug')
      .populate('relatedProductIds', 'name sku price discountPrice images')
      .exec();

    if (!product) {
      throw new NotFoundException(`Product with SKU ${sku} not found`);
    }

    return product;
  }

  async findByFamilySKU(familySKU: string): Promise<Product[]> {
    return this.productModel
      .find({ familySKU: familySKU.toUpperCase(), isActive: true })
      .populate('genderId', 'name slug')
      .populate('categoryId', 'name slug')
      .populate('subcategoryId', 'name slug')
      .sort({ name: 1 })
      .exec();
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    // Validate relationships if being updated
    if (updateProductDto.genderId) {
      await this.genderService.findOne(updateProductDto.genderId);
    }
    if (updateProductDto.categoryId) {
      await this.categoryService.findOne(updateProductDto.categoryId);
    }
    if (updateProductDto.subcategoryId) {
      await this.subcategoryService.findOne(updateProductDto.subcategoryId);
    }

    // Validate discount price
    const newPrice = updateProductDto.price !== undefined ? updateProductDto.price : product.price;
    const newDiscountPrice =
      updateProductDto.discountPrice !== undefined
        ? updateProductDto.discountPrice
        : product.discountPrice;

    if (newDiscountPrice && newDiscountPrice >= newPrice) {
      throw new BadRequestException('Discount price must be less than the regular price');
    }

    // Check SKU uniqueness if being updated
    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const existingSKU = await this.productModel.findOne({
        sku: updateProductDto.sku.toUpperCase(),
        _id: { $ne: id },
      });
      if (existingSKU) {
        throw new ConflictException(`Product with SKU ${updateProductDto.sku} already exists`);
      }
      updateProductDto.sku = updateProductDto.sku.toUpperCase();
    }

    // Normalize familySKU
    if (updateProductDto.familySKU) {
      updateProductDto.familySKU = updateProductDto.familySKU.toUpperCase();
    }

    // Validate related product IDs
    if (updateProductDto.relatedProductIds && updateProductDto.relatedProductIds.length > 0) {
      await this.validateRelatedProducts(updateProductDto.relatedProductIds);
    }

    Object.assign(product, updateProductDto);
    return product.save();
  }

  async remove(id: string): Promise<{ message: string }> {
    const product = await this.findOne(id);
    await product.deleteOne();
    return { message: `Product ${product.name} (SKU: ${product.sku}) has been deleted successfully` };
  }

  async updateStock(id: string, quantity: number): Promise<Product> {
    const product = await this.findOne(id);

    if (product.stock + quantity < 0) {
      throw new BadRequestException('Insufficient stock for this operation');
    }

    product.stock += quantity;
    return product.save();
  }

  private async generateUniqueSKU(genderName: string, categoryName: string): Promise<string> {
    let sku: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      sku = generateSKU(genderName, categoryName);
      const existing = await this.productModel.findOne({ sku });

      if (!existing) {
        return sku;
      }

      attempts++;
    } while (attempts < maxAttempts);

    throw new Error('Unable to generate unique SKU after multiple attempts');
  }

  private async validateRelatedProducts(productIds: string[]): Promise<void> {
    const products = await this.productModel
      .find({ _id: { $in: productIds.map((id) => new Types.ObjectId(id)) } })
      .select('_id')
      .exec();

    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more related product IDs are invalid');
    }
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    await this.categoryService.findOne(categoryId);
    return this.productModel
      .find({ categoryId: new Types.ObjectId(categoryId), isActive: true })
      .populate('genderId', 'name slug')
      .populate('categoryId', 'name slug')
      .populate('subcategoryId', 'name slug')
      .sort({ name: 1 })
      .exec();
  }

  async getProductsBySubcategory(subcategoryId: string): Promise<Product[]> {
    await this.subcategoryService.findOne(subcategoryId);
    return this.productModel
      .find({ subcategoryId: new Types.ObjectId(subcategoryId), isActive: true })
      .populate('genderId', 'name slug')
      .populate('categoryId', 'name slug')
      .populate('subcategoryId', 'name slug')
      .sort({ name: 1 })
      .exec();
  }

  async autosuggest(query: string, limit: number = 10): Promise<any> {
    if (!query || query.trim().length < 2) {
      return {
        products: [],
        categories: [],
        subcategories: [],
      };
    }

    const searchRegex = new RegExp(query, 'i');

    // Search products
    const products = await this.productModel
      .find({
        isActive: true,
        $or: [
          { name: { $regex: searchRegex } },
          { sku: { $regex: searchRegex } },
          { description: { $regex: searchRegex } },
        ],
      })
      .select('_id name sku price discountPrice images')
      .limit(limit)
      .exec();

    // Search categories
    const categories = await this.categoryService.search(query, limit);

    // Search subcategories
    const subcategories = await this.subcategoryService.search(query, limit);

    return {
      products: products.map((p) => ({
        _id: p._id,
        name: p.name,
        sku: p.sku,
        price: p.price,
        discountPrice: p.discountPrice,
        image: p.images && p.images.length > 0 ? p.images[0] : null,
        type: 'product',
      })),
      categories: categories.map((c) => ({
        _id: c._id,
        name: c.name,
        slug: c.slug,
        type: 'category',
      })),
      subcategories: subcategories.map((s) => ({
        _id: s._id,
        name: s.name,
        slug: s.slug,
        type: 'subcategory',
      })),
    };
  }
}

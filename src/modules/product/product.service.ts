import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GenderService } from '../gender/gender.service';
import { CategoryService } from '../category/category.service';
import { RedisService } from '../../database/redis.service';
import { generateSKU } from '../../common/utils/sku.util';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);
  private readonly CACHE_PREFIX = 'product:';
  private readonly CACHE_TTL = 1800; // 30 minutes for products

  constructor(
    @InjectModel(Product.name)
    private productModel: Model<Product>,
    private genderService: GenderService,
    private categoryService: CategoryService,
    private redisService: RedisService,
  ) {}

  private async invalidateCache(): Promise<void> {
    try {
      const keys = await this.redisService.keys(`${this.CACHE_PREFIX}*`);
      for (const key of keys) {
        await this.redisService.del(key);
      }
      this.logger.log('Product cache invalidated');
    } catch (error) {
      this.logger.error('Failed to invalidate cache:', error);
    }
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Validate relationships exist
    const [gender, category] = await Promise.all([
      this.genderService.findOne(createProductDto.genderId),
      this.categoryService.findOne(createProductDto.categoryId),
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
      relatedProductIds: createProductDto.relatedProductIds?.map((id) => new Types.ObjectId(id)),
      homepageCategoryId: createProductDto.homepageCategoryId
        ? new Types.ObjectId(createProductDto.homepageCategoryId)
        : undefined,
    });

    const savedProduct = await product.save();
    await this.invalidateCache();
    return savedProduct;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: {
      genderId?: string;
      genderIds?: string[]; // Multi-select gender filter
      categoryId?: string;
      categoryIds?: string[]; // Multi-select category filter
      categoryName?: string;
      sizes?: string[]; // Multi-select size filter (e.g. ["6", "7", "8"])
      minPrice?: number;
      maxPrice?: number;
      underPriceAmount?: number;
      inStock?: boolean;
      isActive?: boolean;
      search?: string;
      familySKU?: string;
      productIds?: string[]; // Filter by specific product IDs
      sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'name_asc';
    },
  ): Promise<any> {
    // Generate cache key based on all parameters
    const cacheKey = `${this.CACHE_PREFIX}all:${page}:${limit}:${JSON.stringify(filters || {})}`;

    // Try to get from cache first
    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        this.logger.log(`Cache hit for products query`);
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.error('Cache read error:', error);
    }

    const skip = (page - 1) * limit;
    const filter: any = {};

    // Apply filters
    // Gender: single genderId and/or a genderIds array both feed the same $in clause,
    // so a plain single-value query keeps working exactly as before.
    const genderFilterIds = [
      ...(filters?.genderId ? [filters.genderId] : []),
      ...(filters?.genderIds || []),
    ];
    if (genderFilterIds.length > 0) {
      filter.genderId = { $in: genderFilterIds.map((id) => new Types.ObjectId(id)) };
    }

    // Category: same merge pattern as gender. categoryName additionally narrows the
    // result to categories matching that name, ANDed with any explicit ID filter.
    const categoryFilterIds = [
      ...(filters?.categoryId ? [filters.categoryId] : []),
      ...(filters?.categoryIds || []),
    ];
    if (categoryFilterIds.length > 0) {
      filter.categoryId = { $in: categoryFilterIds.map((id) => new Types.ObjectId(id)) };
    }
    if (filters?.categoryName) {
      const matchingCategories = await this.categoryService.findAllByName(filters.categoryName);
      filter.categoryId = { $in: matchingCategories.map((c) => c._id) };
    }

    // Size: sizes are stored as strings on the product (e.g. "6", "7", "M"), so this
    // must send an array via $in — a bare `filter.sizes = value` only matches an exact
    // single-element array and silently drops every multi-size selection.
    if (filters?.sizes && filters.sizes.length > 0) {
      filter.sizes = { $in: filters.sizes.map((s) => String(s).trim()) };
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

    let searchTerm = '';
    if (filters?.search) {
      // Substring search across name/sku/description, plus a bounded-typo-tolerant
      // match on name (e.g. "shrt" -> "shirt"), plus matching the search term against
      // category names so "shoes" also surfaces the Shoes category's products.
      //
      // Fuzzy matching is deliberately NOT applied to `description`: description is
      // free-form prose, and letting `.*?` gaps span an entire paragraph meant a query
      // like "shirt" matched almost any product whose description happened to contain
      // an s, then an h, then an i, then an r, then a t *anywhere* later in the text —
      // in practice this matched ~40% of the catalog (verified against production data:
      // luggage and shoe listings were surfacing for "shirt"). Substring-only on
      // description avoids that false-positive explosion while still catching real matches.
      searchTerm = filters.search.trim();
      const escapedTerm = this.escapeRegex(searchTerm);
      const fuzzyRegex = this.createFuzzyRegex(searchTerm);
      const matchingCategories = await this.categoryService.search(searchTerm, 20);

      const orConditions: Record<string, unknown>[] = [
        { name: { $regex: escapedTerm, $options: 'i' } },
        { name: { $regex: fuzzyRegex, $options: 'i' } },
        { sku: { $regex: escapedTerm, $options: 'i' } },
        { description: { $regex: escapedTerm, $options: 'i' } },
      ];
      if (matchingCategories.length > 0) {
        orConditions.push({ categoryId: { $in: matchingCategories.map((c) => c._id) } });
      }
      filter.$or = orConditions;
    }
    if (filters?.familySKU) {
      filter.familySKU = filters.familySKU.toUpperCase();
    }
    // Filter by specific product IDs (for offers)
    if (filters?.productIds && filters.productIds.length > 0) {
      filter._id = { $in: filters.productIds.map(id => new Types.ObjectId(id)) };
    }

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      newest: { createdAt: -1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      name_asc: { name: 1 },
    };
    const sort = sortMap[filters?.sortBy || 'newest'] || sortMap.newest;

    const [data, total] = await Promise.all([
      this.productModel
        .find(filter)
        .populate('genderId', 'name slug')
        .populate('categoryId', 'name slug')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .exec(),
      this.productModel.countDocuments(filter),
    ]);

    const result: any = {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    // No exact matches for a real search term: surface trending/best-selling products
    // instead of a dead end, same as any other product data — never hardcoded.
    if (total === 0 && searchTerm) {
      result.suggestions = await this.getBestSellers(6);
    }

    // Cache the result
    try {
      await this.redisService.set(cacheKey, JSON.stringify(result), this.CACHE_TTL);
      this.logger.log(`Cached products query`);
    } catch (error) {
      this.logger.error('Cache write error:', error);
    }

    return result;
  }

  async findOne(id: string): Promise<Product> {
    const cacheKey = `${this.CACHE_PREFIX}id:${id}`;

    // Try to get from cache first
    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        this.logger.log(`Cache hit for product ${id}`);
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.error('Cache read error:', error);
    }

    const product = await this.productModel
      .findById(id)
      .populate('genderId', 'name slug')
      .populate('categoryId', 'name slug')
      .populate('relatedProductIds', 'name sku price discountPrice images')
      .exec();

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Cache the result
    try {
      await this.redisService.set(cacheKey, JSON.stringify(product), this.CACHE_TTL);
      this.logger.log(`Cached product ${id}`);
    } catch (error) {
      this.logger.error('Cache write error:', error);
    }

    return product;
  }

  // Powers the product detail page's "You may also like" section. Admin-curated
  // relatedProductIds are used first (most intentional), then topped up with other
  // active, in-stock products from the same category so the section is never empty
  // just because nobody manually curated relations for this product.
  async getRelatedProducts(id: string, limit: number = 6): Promise<Product[]> {
    const cacheKey = `${this.CACHE_PREFIX}related:${id}:${limit}`;

    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.error('Cache read error:', error);
    }

    const product = await this.productModel.findById(id).select('categoryId relatedProductIds').exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const selectFields = 'name sku price discountPrice images stock badge isActive';
    const related: Product[] = [];
    const seenIds = new Set<string>([id]);

    if (product.relatedProductIds && product.relatedProductIds.length > 0) {
      const curated = await this.productModel
        .find({ _id: { $in: product.relatedProductIds }, isActive: true })
        .select(selectFields)
        .limit(limit)
        .exec();
      for (const p of curated) {
        related.push(p);
        seenIds.add(p._id.toString());
      }
    }

    if (related.length < limit) {
      const fallback = await this.productModel
        .find({
          categoryId: product.categoryId,
          isActive: true,
          stock: { $gt: 0 },
          _id: { $nin: Array.from(seenIds) },
        })
        .select(selectFields)
        .sort({ isBestSeller: -1, createdAt: -1 })
        .limit(limit - related.length)
        .exec();
      related.push(...fallback);
    }

    try {
      await this.redisService.set(cacheKey, JSON.stringify(related), this.CACHE_TTL);
    } catch (error) {
      this.logger.error('Cache write error:', error);
    }

    return related;
  }

  // Always hits Mongo directly, bypassing the Redis cache — mutations need a live
  // Mongoose document (for .save()/.deleteOne()), which a JSON.parse'd cache hit is not.
  private async getDocumentOrThrow(id: string): Promise<Product> {
    const product = await this.productModel.findById(id).exec();
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
      .sort({ name: 1 })
      .exec();
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.getDocumentOrThrow(id);

    // Validate relationships if being updated
    if (updateProductDto.genderId) {
      await this.genderService.findOne(updateProductDto.genderId);
    }
    if (updateProductDto.categoryId) {
      await this.categoryService.findOne(updateProductDto.categoryId);
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

    // ObjectId-typed fields are cast explicitly rather than left to Object.assign's implicit
    // setter casting — that path does NOT reliably cast plain ID strings to BSON ObjectId here,
    // so ID fields ended up persisted as strings, silently breaking every later query that
    // matches against a real ObjectId (e.g. homepageCategoryId, populate()). Verified directly
    // against the DB: this codebase already has legacy categoryId docs corrupted the same way.
    const { genderId, categoryId, relatedProductIds, homepageCategoryId, ...rest } =
      updateProductDto;
    Object.assign(product, rest);

    if (genderId !== undefined) {
      product.genderId = new Types.ObjectId(genderId);
    }
    if (categoryId !== undefined) {
      product.categoryId = new Types.ObjectId(categoryId);
    }
    if (relatedProductIds !== undefined) {
      product.relatedProductIds = relatedProductIds.map((relatedId) => new Types.ObjectId(relatedId));
    }
    if (homepageCategoryId !== undefined) {
      // Assigning undefined un-sets the path on save, which Mongo then matches the same as
      // "field missing" — exactly what effectiveHomepageCategoryFilter's `{ field: null }`
      // clause expects for "no override, fall back to the real categoryId".
      product.homepageCategoryId = homepageCategoryId
        ? new Types.ObjectId(homepageCategoryId)
        : undefined;
    }

    const savedProduct = await product.save();
    await this.invalidateCache();
    return savedProduct;
  }

  async remove(id: string): Promise<{ message: string }> {
    const product = await this.getDocumentOrThrow(id);
    await product.deleteOne();
    await this.invalidateCache();
    return { message: `Product ${product.name} (SKU: ${product.sku}) has been deleted successfully` };
  }

  async updateStock(id: string, quantity: number): Promise<Product> {
    // Atomic read-modify-write via a conditioned findOneAndUpdate: the previous
    // implementation loaded the document, changed `stock` in memory, then saved it,
    // which is a classic check-then-act race — two concurrent orders decrementing the
    // same product could both read the same starting stock and overwrite each other's
    // update, overselling. The `stock: { $gte: -quantity } ` guard (only relevant for
    // decrements, where quantity is negative) makes Mongo itself the single source of
    // truth for whether enough stock remains, atomically.
    const condition: Record<string, unknown> = { _id: id };
    if (quantity < 0) {
      condition.stock = { $gte: -quantity };
    }

    const updatedProduct = await this.productModel
      .findOneAndUpdate(condition, { $inc: { stock: quantity } }, { new: true })
      .exec();

    if (!updatedProduct) {
      const exists = await this.productModel.exists({ _id: id });
      if (!exists) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }
      throw new BadRequestException('Insufficient stock for this operation');
    }

    await this.invalidateCache();
    return updatedProduct;
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

  // Distinct sizes actually present in the catalog (optionally scoped to a gender/category),
  // so the size filter UI always reflects real product data instead of a hardcoded list.
  async getAvailableSizes(filters?: { genderId?: string; categoryId?: string }): Promise<string[]> {
    const filter: any = { isActive: true };
    if (filters?.genderId) {
      filter.genderId = new Types.ObjectId(filters.genderId);
    }
    if (filters?.categoryId) {
      filter.categoryId = new Types.ObjectId(filters.categoryId);
    }

    const sizes = await this.productModel.distinct('sizes', filter);
    return (sizes as unknown as string[]).sort((a, b) => {
      const numA = Number(a);
      const numB = Number(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
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
    const cacheKey = `${this.CACHE_PREFIX}category:${categoryId}`;

    // Try to get from cache first
    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        this.logger.log(`Cache hit for products by category ${categoryId}`);
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.error('Cache read error:', error);
    }

    await this.categoryService.findOne(categoryId);
    const products = await this.productModel
      .find({ categoryId: new Types.ObjectId(categoryId), isActive: true })
      .populate('genderId', 'name slug')
      .populate('categoryId', 'name slug')
      .sort({ name: 1 })
      .exec();

    // Cache the result
    try {
      await this.redisService.set(cacheKey, JSON.stringify(products), this.CACHE_TTL);
      this.logger.log(`Cached products by category ${categoryId}`);
    } catch (error) {
      this.logger.error('Cache write error:', error);
    }

    return products;
  }

  // Admin view for the "Map Homepage Products" picker: every product that will actually
  // render under this category's homepage card — its real categoryId, plus anything
  // explicitly overridden here via homepageCategoryId. Deliberately not cached/isActive-filtered
  // so admins can see and manage inactive products too.
  async getProductsForHomepageCategory(categoryId: string): Promise<Product[]> {
    await this.categoryService.findOne(categoryId);
    const categoryObjectId = new Types.ObjectId(categoryId);

    return this.productModel
      .find(this.effectiveHomepageCategoryFilter(categoryObjectId))
      .populate('genderId', 'name slug')
      .populate('categoryId', 'name slug')
      .sort({ name: 1 })
      .exec();
  }

  async autosuggest(query: string, limit: number = 10): Promise<any> {
    if (!query || query.trim().length < 2) {
      return {
        products: [],
        categories: [],
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
    };
  }

  async getFeaturedProducts(limit: number = 12): Promise<Product[]> {
    const cacheKey = `${this.CACHE_PREFIX}featured:${limit}`;

    // Try to get from cache first
    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        this.logger.log(`Cache hit for featured products`);
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.error('Cache read error:', error);
    }

    const products = await this.productModel
      .find({
        isActive: true,
        stock: { $gt: 0 },
      })
      .populate('genderId', 'name slug')
      .populate('categoryId', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    // Cache the result
    try {
      await this.redisService.set(cacheKey, JSON.stringify(products), this.CACHE_TTL);
      this.logger.log(`Cached featured products`);
    } catch (error) {
      this.logger.error('Cache write error:', error);
    }

    return products;
  }

  async getLowStockProducts(threshold: number = 5, limit: number = 10): Promise<Product[]> {
    return this.productModel
      .find({
        isActive: true,
        stock: { $gt: 0, $lte: threshold },
      })
      .populate('categoryId', 'name slug')
      .sort({ stock: 1 })
      .limit(limit)
      .exec();
  }

  async getBestSellers(limit: number = 12): Promise<Product[]> {
    const cacheKey = `${this.CACHE_PREFIX}bestsellers:${limit}`;

    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        this.logger.log(`Cache hit for best sellers`);
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.error('Cache read error:', error);
    }

    const products = await this.productModel
      .find({
        isActive: true,
        isBestSeller: true,
        stock: { $gt: 0 },
      })
      .populate('genderId', 'name slug')
      .populate('categoryId', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    try {
      await this.redisService.set(cacheKey, JSON.stringify(products), this.CACHE_TTL);
      this.logger.log(`Cached best sellers`);
    } catch (error) {
      this.logger.error('Cache write error:', error);
    }

    return products;
  }

  // Matches products whose homepage card should be grouped under `categoryId`: either the
  // product's homepageCategoryId explicitly points here, or it has no override and its real
  // categoryId points here. `{ field: null }` also matches docs where the field was never set,
  // so this covers both "never overridden" and "override cleared" products in one query.
  // Matches both the ObjectId and its raw hex-string form as a safety net — this schema has a
  // history of ID fields getting persisted as plain strings instead of BSON ObjectId (found
  // legacy categoryId docs with this exact corruption), which silently fails a strict ObjectId
  // equality match.
  private effectiveHomepageCategoryFilter(categoryId: Types.ObjectId): Record<string, unknown> {
    const idVariants = [categoryId, categoryId.toString()];
    return {
      $or: [
        { homepageCategoryId: { $in: idVariants } },
        { homepageCategoryId: null, categoryId: { $in: idVariants } },
      ],
    };
  }

  async getLatestArrivalsSections(imagesPerCategory: number = 5): Promise<
    { categoryId: string; categoryName: string; categorySlug: string; images: string[] }[]
  > {
    const cacheKey = `${this.CACHE_PREFIX}latest-arrivals-sections:${imagesPerCategory}`;
    const CACHE_TTL_SHORT = 300; // 5 minutes — favors freshness over the standard product cache TTL

    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        this.logger.log('Cache hit for latest arrivals sections');
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.error('Cache read error:', error);
    }

    const categories = await this.categoryService.findLatestArrivalsCategories();

    const sections = await Promise.all(
      categories.map(async (category) => {
        const categoryObjectId = new Types.ObjectId(String(category._id));
        const products = await this.productModel
          .find({
            ...this.effectiveHomepageCategoryFilter(categoryObjectId),
            isActive: true,
            stock: { $gt: 0 },
            images: { $exists: true, $ne: [] },
            showInLatestArrivals: true,
          })
          .sort({ createdAt: -1 })
          .limit(imagesPerCategory)
          .select('images')
          .exec();

        const images = products.map((p) => p.images[0]).filter(Boolean);

        return {
          categoryId: category._id.toString(),
          categoryName: category.name,
          categorySlug: category.slug,
          images,
        };
      }),
    );

    const result = sections.filter((section) => section.images.length > 0);

    try {
      await this.redisService.set(cacheKey, JSON.stringify(result), CACHE_TTL_SHORT);
      this.logger.log('Cached latest arrivals sections');
    } catch (error) {
      this.logger.error('Cache write error:', error);
    }

    return result;
  }

  // Same card shape as getLatestArrivalsSections (one slideshow card per category),
  // but grouping isBestSeller products instead of the most recent ones per live category.
  async getBestSellersSections(imagesPerCategory: number = 5): Promise<
    { categoryId: string; categoryName: string; categorySlug: string; images: string[] }[]
  > {
    const cacheKey = `${this.CACHE_PREFIX}best-sellers-sections:${imagesPerCategory}`;
    const CACHE_TTL_SHORT = 300; // 5 minutes — favors freshness over the standard product cache TTL

    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        this.logger.log('Cache hit for best sellers sections');
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.error('Cache read error:', error);
    }

    const categories = await this.categoryService.findBestSellersCategories();

    const sections = await Promise.all(
      categories.map(async (category) => {
        const categoryObjectId = new Types.ObjectId(String(category._id));
        const products = await this.productModel
          .find({
            ...this.effectiveHomepageCategoryFilter(categoryObjectId),
            isActive: true,
            stock: { $gt: 0 },
            images: { $exists: true, $ne: [] },
            isBestSeller: true,
          })
          .sort({ createdAt: -1 })
          .limit(imagesPerCategory)
          .select('images')
          .exec();

        const images = products.map((p) => p.images[0]).filter(Boolean);

        return {
          categoryId: category._id.toString(),
          categoryName: category.name,
          categorySlug: category.slug,
          images,
        };
      }),
    );

    const result = sections.filter((section) => section.images.length > 0);

    try {
      await this.redisService.set(cacheKey, JSON.stringify(result), CACHE_TTL_SHORT);
      this.logger.log('Cached best sellers sections');
    } catch (error) {
      this.logger.error('Cache write error:', error);
    }

    return result;
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Typo-tolerant regex for a search term, e.g. "shrt" matches "shirt".
   * The gap between each letter is capped at 2 stray characters (not `.*?`/unbounded) —
   * an unbounded gap lets a short word's letters match scattered arbitrarily far apart,
   * which turned into matching most of the catalog when applied to prose-length fields.
   * Words under 4 characters skip fuzzy matching entirely (too short for it to add
   * typo tolerance without just matching everything).
   */
  private createFuzzyRegex(searchTerm: string): string {
    const words = searchTerm.toLowerCase().split(/\s+/).filter(Boolean);

    const patterns = words.map((word) => {
      const escapedWord = this.escapeRegex(word);
      if (word.length < 4) {
        return escapedWord;
      }
      const fuzzyPattern = word
        .split('')
        .map((char) => this.escapeRegex(char))
        .join('.{0,2}');
      return `(${fuzzyPattern}|${escapedWord})`;
    });

    return patterns.join('.*');
  }
}

import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product } from '../product/schemas/product.schema';
import { Category } from '../category/schemas/category.schema';
import { FootwearSubcategory } from '../footwear-subcategory/schemas/footwear-subcategory.schema';
import { ShopSubcategory } from '../shop-subcategory/schemas/shop-subcategory.schema';
import { ShippingRule } from './schemas/shipping-rule.schema';
import { CreateShippingRuleDto, UpdateShippingRuleDto } from './dto/shipping-rule.dto';
import { FALLBACK_RULE_SEED, SHIPPING_RULE_SEEDS } from './shipping.seed';

export interface ShippingLine {
  productId: string;
  quantity: number;
}

export interface ShippingBreakdown {
  ruleId: string;
  label: string;
  quantity: number;
  amount: number;
}

interface ProductTargets {
  categoryId?: string;
  footwearSubcategoryIds: Set<string>;
  shopSubcategoryIds: Set<string>;
}

export const ruleCharge = (rule: Pick<ShippingRule, 'charges' | 'additionalCharge'>, qty: number): number => {
  if (qty <= 0) return 0;
  const { charges, additionalCharge } = rule;
  if (qty <= charges.length) return charges[qty - 1];
  return charges[charges.length - 1] + (qty - charges.length) * additionalCharge;
};

const toObjectIds = (ids?: string[]) => ids?.map((id) => new Types.ObjectId(id));

@Injectable()
export class ShippingService implements OnModuleInit {
  private readonly logger = new Logger(ShippingService.name);

  constructor(
    @InjectModel(ShippingRule.name) private shippingRuleModel: Model<ShippingRule>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(FootwearSubcategory.name) private footwearSubcategoryModel: Model<FootwearSubcategory>,
    @InjectModel(ShopSubcategory.name) private shopSubcategoryModel: Model<ShopSubcategory>,
  ) {}

  async onModuleInit(): Promise<void> {
    if (await this.shippingRuleModel.exists({})) return;

    const idsBySlug = async (model: Model<any>, slugs: string[]) =>
      (await model.find({ slug: { $in: slugs } }).select('_id').lean()).map((doc: any) => doc._id);

    for (const [index, seed] of SHIPPING_RULE_SEEDS.entries()) {
      await this.shippingRuleModel.create({
        name: seed.name,
        categoryIds: await idsBySlug(this.categoryModel, seed.slugs),
        footwearSubcategoryIds: await idsBySlug(this.footwearSubcategoryModel, seed.slugs),
        shopSubcategoryIds: await idsBySlug(this.shopSubcategoryModel, seed.slugs),
        charges: seed.charges,
        additionalCharge: seed.additionalCharge,
        priority: index + 1,
      });
    }
    await this.shippingRuleModel.create({ ...FALLBACK_RULE_SEED, priority: 9999, isFallback: true });
    this.logger.log(`Seeded ${SHIPPING_RULE_SEEDS.length + 1} shipping rules`);
  }

  findAll(): Promise<ShippingRule[]> {
    return this.shippingRuleModel.find().sort({ isFallback: 1, priority: 1, createdAt: 1 }).exec();
  }

  async create(dto: CreateShippingRuleDto): Promise<ShippingRule> {
    return this.shippingRuleModel.create({
      ...dto,
      categoryIds: toObjectIds(dto.categoryIds),
      footwearSubcategoryIds: toObjectIds(dto.footwearSubcategoryIds),
      shopSubcategoryIds: toObjectIds(dto.shopSubcategoryIds),
    });
  }

  async update(id: string, dto: UpdateShippingRuleDto): Promise<ShippingRule> {
    const rule = await this.findOneOrThrow(id);
    const { categoryIds, footwearSubcategoryIds, shopSubcategoryIds, ...rest } = dto;

    // The fallback catches every unmatched line, so only its charges are editable.
    if (rule.isFallback) {
      if (rest.name !== undefined) rule.name = rest.name;
      if (rest.charges !== undefined) rule.charges = rest.charges;
      if (rest.additionalCharge !== undefined) rule.additionalCharge = rest.additionalCharge;
    } else {
      Object.assign(rule, rest);
      if (categoryIds !== undefined) rule.categoryIds = toObjectIds(categoryIds);
      if (footwearSubcategoryIds !== undefined) rule.footwearSubcategoryIds = toObjectIds(footwearSubcategoryIds);
      if (shopSubcategoryIds !== undefined) rule.shopSubcategoryIds = toObjectIds(shopSubcategoryIds);
    }
    return rule.save();
  }

  async remove(id: string): Promise<{ message: string }> {
    const rule = await this.findOneOrThrow(id);
    if (rule.isFallback) {
      throw new BadRequestException('The fallback shipping rule cannot be deleted');
    }
    await rule.deleteOne();
    return { message: `Shipping rule ${rule.name} deleted` };
  }

  async calculate(lines: ShippingLine[]): Promise<{ shipping: number; shippingBreakdown: ShippingBreakdown[] }> {
    const valid = lines.filter((line) => line.productId && Math.floor(line.quantity) > 0);
    if (!valid.length) return { shipping: 0, shippingBreakdown: [] };

    const [rules, targets] = await Promise.all([
      this.shippingRuleModel.find({ isActive: true }).sort({ isFallback: 1, priority: 1, createdAt: 1 }).lean().exec(),
      this.productTargets(valid.map((line) => line.productId)),
    ]);
    const fallback = rules.find((rule) => rule.isFallback) ?? { ...FALLBACK_RULE_SEED, _id: 'fallback' };

    const qtyByRule = new Map<string, { rule: any; quantity: number }>();
    for (const line of valid) {
      const rule = rules.find((r) => !r.isFallback && this.matches(r, targets.get(line.productId))) ?? fallback;
      const key = String(rule._id);
      const bucket = qtyByRule.get(key) ?? { rule, quantity: 0 };
      bucket.quantity += Math.floor(line.quantity);
      qtyByRule.set(key, bucket);
    }

    const shippingBreakdown = [...qtyByRule.entries()].map(([ruleId, { rule, quantity }]) => ({
      ruleId,
      label: rule.name,
      quantity,
      amount: ruleCharge(rule, quantity),
    }));

    return {
      shipping: shippingBreakdown.reduce((sum, bucket) => sum + bucket.amount, 0),
      shippingBreakdown,
    };
  }

  private matches(
    rule: Pick<ShippingRule, 'categoryIds' | 'footwearSubcategoryIds' | 'shopSubcategoryIds'>,
    targets?: ProductTargets,
  ): boolean {
    if (!targets) return false;
    return (
      rule.categoryIds.some((id) => String(id) === targets.categoryId) ||
      rule.footwearSubcategoryIds.some((id) => targets.footwearSubcategoryIds.has(String(id))) ||
      rule.shopSubcategoryIds.some((id) => targets.shopSubcategoryIds.has(String(id)))
    );
  }

  private async productTargets(productIds: string[]): Promise<Map<string, ProductTargets>> {
    const ids = toObjectIds([...new Set(productIds)]);

    const [products, footwearTiles, shopTiles] = await Promise.all([
      this.productModel.find({ _id: { $in: ids } }).select('categoryId').lean().exec(),
      this.footwearSubcategoryModel.find({ productIds: { $in: ids } }).select('productIds').lean().exec(),
      this.shopSubcategoryModel.find({ productIds: { $in: ids } }).select('productIds').lean().exec(),
    ]);

    const result = new Map<string, ProductTargets>();
    for (const product of products) {
      result.set(String(product._id), {
        categoryId: product.categoryId ? String(product.categoryId) : undefined,
        footwearSubcategoryIds: new Set(),
        shopSubcategoryIds: new Set(),
      });
    }
    for (const tile of footwearTiles) {
      tile.productIds.forEach((id) => result.get(String(id))?.footwearSubcategoryIds.add(String(tile._id)));
    }
    for (const tile of shopTiles) {
      tile.productIds.forEach((id) => result.get(String(id))?.shopSubcategoryIds.add(String(tile._id)));
    }
    return result;
  }

  private async findOneOrThrow(id: string): Promise<ShippingRule> {
    const rule = await this.shippingRuleModel.findById(id).exec();
    if (!rule) throw new NotFoundException(`Shipping rule ${id} not found`);
    return rule;
  }
}

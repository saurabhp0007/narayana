import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Offer, OfferType } from './schemas/offer.schema';
import { CreateOfferDto } from './dto/create-offer.dto';

@Injectable()
export class OfferService {
  constructor(
    @InjectModel(Offer.name)
    private offerModel: Model<Offer>,
  ) {}

  async create(createOfferDto: CreateOfferDto): Promise<Offer> {
    const startDate = new Date(createOfferDto.startDate);
    const endDate = new Date(createOfferDto.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    const offer = new this.offerModel({
      ...createOfferDto,
      startDate,
      endDate,
      productIds: createOfferDto.productIds?.map(id => new Types.ObjectId(id)),
      categoryIds: createOfferDto.categoryIds?.map(id => new Types.ObjectId(id)),
      genderIds: createOfferDto.genderIds?.map(id => new Types.ObjectId(id)),
    });

    return offer.save();
  }

  async findAll(page: number = 1, limit: number = 10, isActive?: boolean): Promise<any> {
    const skip = (page - 1) * limit;
    const filter: any = {};

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      this.offerModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ priority: -1, createdAt: -1 })
        .exec(),
      this.offerModel.countDocuments(filter),
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

  async findOne(id: string): Promise<Offer> {
    const offer = await this.offerModel.findById(id).exec();
    if (!offer) {
      throw new NotFoundException(`Offer with ID ${id} not found`);
    }
    return offer;
  }

  async update(id: string, updateOfferDto: Partial<CreateOfferDto>): Promise<Offer> {
    const offer = await this.findOne(id);
    Object.assign(offer, updateOfferDto);
    return offer.save();
  }

  async remove(id: string): Promise<{ message: string }> {
    const offer = await this.findOne(id);
    await offer.deleteOne();
    return { message: `Offer ${offer.name} has been deleted successfully` };
  }

  async getActiveOffers(): Promise<Offer[]> {
    const now = new Date();
    return this.offerModel
      .find({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
      })
      .sort({ priority: -1 })
      .exec();
  }

  async getNavbarOffers(): Promise<Offer[]> {
    const now = new Date();
    return this.offerModel
      .find({
        isActive: true,
        displayInNavbar: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
      })
      .sort({ priority: -1 })
      .exec();
  }

  async getOffersForProduct(productId: string): Promise<Offer[]> {
    const now = new Date();
    const productObjectId = new Types.ObjectId(productId);

    // Find offers that include this specific product
    const productOffers = await this.offerModel
      .find({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
        productIds: productObjectId,
      })
      .sort({ priority: -1 })
      .exec();

    if (productOffers.length > 0) {
      return productOffers;
    }

    // If no product-specific offers, check category/gender offers
    // This requires populating product data to get category/gender
    // For now, return empty if no product-specific offers
    // TODO: Enhance to check category/gender level offers

    return [];
  }

  async getBestOfferForProduct(
    productId: string,
    quantity: number,
    price: number,
  ): Promise<{ offer: Offer | null; discount: number }> {
    const offers = await this.getOffersForProduct(productId);

    if (offers.length === 0) {
      return { offer: null, discount: 0 };
    }

    let bestOffer: Offer | null = null;
    let maxDiscount = 0;

    for (const offer of offers) {
      const discount = this.calculateOfferDiscount(offer, quantity, price);
      if (discount > maxDiscount) {
        maxDiscount = discount;
        bestOffer = offer;
      }
    }

    return { offer: bestOffer, discount: maxDiscount };
  }

  /**
   * Compute offer discounts across an entire cart at once, so that bundle/buyXgetY
   * offers can be satisfied by mixing quantities across different eligible products
   * (e.g. "any 3 shoes from this 252-product set for ₹10,000"), not just repeat
   * purchases of a single SKU. Processes offers in priority order; once a unit is
   * consumed by one offer it is not eligible for a lower-priority offer.
   */
  async computeCartOfferDiscounts(
    lines: Array<{ productId: string; quantity: number; unitPrice: number }>,
  ): Promise<{
    perProductDiscount: Record<string, number>;
    perProductOffer: Record<string, { _id: string; name: string; description?: string; offerType: OfferType } | null>;
    totalDiscount: number;
  }> {
    const perProductDiscount: Record<string, number> = {};
    const perProductOffer: Record<
      string,
      { _id: string; name: string; description?: string; offerType: OfferType } | null
    > = {};
    const remainingQty: Record<string, number> = {};
    const unitPriceOf: Record<string, number> = {};

    for (const line of lines) {
      perProductDiscount[line.productId] = 0;
      perProductOffer[line.productId] = null;
      remainingQty[line.productId] = line.quantity;
      unitPriceOf[line.productId] = line.unitPrice;
    }

    if (lines.length === 0) {
      return { perProductDiscount, perProductOffer, totalDiscount: 0 };
    }

    const activeOffers = await this.getActiveOffers();

    for (const offer of activeOffers) {
      const offerProductIds = new Set((offer.productIds || []).map((id) => id.toString()));
      const matched = lines
        .map((l) => l.productId)
        .filter((pid) => offerProductIds.has(pid) && remainingQty[pid] > 0);

      if (matched.length === 0) continue;

      if (offer.offerType === OfferType.BUNDLE_DISCOUNT) {
        this.applyBundleDiscount(offer, matched, remainingQty, unitPriceOf, perProductDiscount, perProductOffer);
      } else if (offer.offerType === OfferType.BUY_X_GET_Y) {
        this.applyBuyXGetY(offer, matched, remainingQty, unitPriceOf, perProductDiscount, perProductOffer);
      } else {
        // Percentage/fixed-amount offers stay per-line (no cross-product grouping needed)
        for (const pid of matched) {
          const qty = remainingQty[pid];
          if (qty <= 0) continue;
          const discount = this.calculateOfferDiscount(offer, qty, unitPriceOf[pid]);
          if (discount > 0) {
            perProductDiscount[pid] += discount;
            perProductOffer[pid] = perProductOffer[pid] || this.toOfferSummary(offer);
            remainingQty[pid] = 0;
          }
        }
      }
    }

    const totalDiscount = Object.values(perProductDiscount).reduce((a, b) => a + b, 0);
    return { perProductDiscount, perProductOffer, totalDiscount };
  }

  private toOfferSummary(offer: Offer) {
    return { _id: offer._id.toString(), name: offer.name, description: offer.description, offerType: offer.offerType };
  }

  private applyBundleDiscount(
    offer: Offer,
    matchedIds: string[],
    remainingQty: Record<string, number>,
    unitPriceOf: Record<string, number>,
    perProductDiscount: Record<string, number>,
    perProductOffer: Record<string, any>,
  ): void {
    const { bundlePrice, minQuantity } = offer.rules;
    if (!bundlePrice || !minQuantity) return;

    const combinedQty = matchedIds.reduce((sum, pid) => sum + remainingQty[pid], 0);
    const sets = Math.floor(combinedQty / minQuantity);
    if (sets === 0) return;

    let unitsToConsume = sets * minQuantity;
    // Consume the highest-priced eligible units first so the flat bundle price maximizes customer benefit
    const sorted = [...matchedIds].sort((a, b) => unitPriceOf[b] - unitPriceOf[a]);

    let consumedValue = 0;
    const consumedFrom: Record<string, number> = {};

    for (const pid of sorted) {
      if (unitsToConsume <= 0) break;
      const take = Math.min(remainingQty[pid], unitsToConsume);
      if (take <= 0) continue;
      consumedFrom[pid] = take;
      consumedValue += take * unitPriceOf[pid];
      unitsToConsume -= take;
    }

    const totalDiscount = Math.max(0, consumedValue - sets * bundlePrice);
    if (totalDiscount <= 0) return;

    for (const pid of Object.keys(consumedFrom)) {
      const share = (consumedFrom[pid] * unitPriceOf[pid]) / consumedValue;
      perProductDiscount[pid] += share * totalDiscount;
      perProductOffer[pid] = perProductOffer[pid] || this.toOfferSummary(offer);
      remainingQty[pid] -= consumedFrom[pid];
    }
  }

  private applyBuyXGetY(
    offer: Offer,
    matchedIds: string[],
    remainingQty: Record<string, number>,
    unitPriceOf: Record<string, number>,
    perProductDiscount: Record<string, number>,
    perProductOffer: Record<string, any>,
  ): void {
    const { buyQuantity, getQuantity } = offer.rules;
    if (!buyQuantity || !getQuantity) return;

    const setSize = buyQuantity + getQuantity;
    const combinedQty = matchedIds.reduce((sum, pid) => sum + remainingQty[pid], 0);
    const sets = Math.floor(combinedQty / setSize);
    if (sets === 0) return;

    let freeRemaining = sets * getQuantity;
    let totalToConsume = sets * setSize;

    // Cheapest units become the "free" ones first (most conservative default for the retailer)
    const sorted = [...matchedIds].sort((a, b) => unitPriceOf[a] - unitPriceOf[b]);

    const consumedFrom: Record<string, number> = {};
    const discountFrom: Record<string, number> = {};

    for (const pid of sorted) {
      if (totalToConsume <= 0) break;
      const availableHere = Math.min(remainingQty[pid], totalToConsume);
      if (availableHere <= 0) continue;

      const freeHere = Math.min(freeRemaining, availableHere);
      if (freeHere > 0) {
        discountFrom[pid] = (discountFrom[pid] || 0) + freeHere * unitPriceOf[pid];
        freeRemaining -= freeHere;
      }
      consumedFrom[pid] = (consumedFrom[pid] || 0) + availableHere;
      totalToConsume -= availableHere;
    }

    const totalDiscount = Object.values(discountFrom).reduce((a, b) => a + b, 0);
    if (totalDiscount <= 0) return;

    for (const pid of Object.keys(consumedFrom)) {
      if (discountFrom[pid]) {
        perProductDiscount[pid] += discountFrom[pid];
      }
      perProductOffer[pid] = perProductOffer[pid] || this.toOfferSummary(offer);
      remainingQty[pid] -= consumedFrom[pid];
    }
  }

  calculateOfferDiscount(offer: Offer, quantity: number, originalPrice: number): number {
    switch (offer.offerType) {
      case OfferType.BUY_X_GET_Y:
        return this.calculateBuyXGetY(offer, quantity, originalPrice);
      case OfferType.BUNDLE_DISCOUNT:
        return this.calculateBundleDiscount(offer, quantity, originalPrice);
      case OfferType.PERCENTAGE_OFF:
        return this.calculatePercentageOff(offer, quantity, originalPrice);
      case OfferType.FIXED_AMOUNT_OFF:
        return this.calculateFixedAmountOff(offer, quantity, originalPrice);
      default:
        return 0;
    }
  }

  private calculateBuyXGetY(offer: Offer, quantity: number, originalPrice: number): number {
    const { buyQuantity, getQuantity } = offer.rules;
    if (!buyQuantity || getQuantity === undefined) return 0;

    const sets = Math.floor(quantity / (buyQuantity + getQuantity));
    const freeItems = sets * getQuantity;
    return freeItems * originalPrice;
  }

  private calculateBundleDiscount(offer: Offer, quantity: number, originalPrice: number): number {
    const { bundlePrice, minQuantity } = offer.rules;
    if (!bundlePrice || !minQuantity || quantity < minQuantity) return 0;

    const regularTotal = quantity * originalPrice;
    const bundleTotal = bundlePrice;
    return Math.max(0, regularTotal - bundleTotal);
  }

  private calculatePercentageOff(offer: Offer, quantity: number, originalPrice: number): number {
    const { discountPercentage, minQuantity } = offer.rules;
    if (!discountPercentage || (minQuantity && quantity < minQuantity)) return 0;

    return (quantity * originalPrice * discountPercentage) / 100;
  }

  private calculateFixedAmountOff(offer: Offer, quantity: number, originalPrice: number): number {
    const { discountAmount, minQuantity } = offer.rules;
    if (!discountAmount || (minQuantity && quantity < minQuantity)) return 0;

    return Math.min(discountAmount, quantity * originalPrice);
  }
}

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
      subcategoryIds: createOfferDto.subcategoryIds?.map(id => new Types.ObjectId(id)),
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

    // If no product-specific offers, check category/subcategory/gender offers
    // This requires populating product data to get category/subcategory/gender
    // For now, return empty if no product-specific offers
    // TODO: Enhance to check category/subcategory/gender level offers

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

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

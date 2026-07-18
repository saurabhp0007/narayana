import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review } from './schemas/review.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Review.name)
    private reviewModel: Model<Review>,
  ) {}

  async create(createReviewDto: CreateReviewDto): Promise<Review> {
    const review = new this.reviewModel({
      ...createReviewDto,
      productId: createReviewDto.productId ? new Types.ObjectId(createReviewDto.productId) : undefined,
      categoryId: createReviewDto.categoryId ? new Types.ObjectId(createReviewDto.categoryId) : undefined,
    });
    return review.save();
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    isApproved?: boolean,
  ): Promise<any> {
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (isApproved !== undefined) {
      filter.isApproved = isApproved;
    }

    const [data, total] = await Promise.all([
      this.reviewModel
        .find(filter)
        .sort({ displayOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.reviewModel.countDocuments(filter),
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

  async findOne(id: string): Promise<Review> {
    const review = await this.reviewModel.findById(id).exec();
    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }
    return review;
  }

  async getHomepageReviews(limit: number = 8): Promise<Review[]> {
    return this.reviewModel
      .find({ isApproved: true, displayOnHomepage: true })
      .sort({ displayOrder: 1, createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async getReviewSummary(filter: {
    productId?: string;
    categoryId?: string;
  } = {}): Promise<{ averageRating: number; totalReviews: number }> {
    const match: any = { isApproved: true };
    if (filter.productId) match.productId = new Types.ObjectId(filter.productId);
    if (filter.categoryId) match.categoryId = new Types.ObjectId(filter.categoryId);

    const [result] = await this.reviewModel.aggregate([
      { $match: match },
      { $group: { _id: null, averageRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } },
    ]);

    return {
      averageRating: result ? Math.round(result.averageRating * 10) / 10 : 0,
      totalReviews: result ? result.totalReviews : 0,
    };
  }

  async findByScope(query: {
    productId?: string;
    categoryId?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: any = { isApproved: true };
    if (query.productId) filter.productId = new Types.ObjectId(query.productId);
    if (query.categoryId) filter.categoryId = new Types.ObjectId(query.categoryId);

    const [data, total] = await Promise.all([
      this.reviewModel
        .find(filter)
        .sort({ displayOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.reviewModel.countDocuments(filter),
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

  async update(id: string, updateReviewDto: UpdateReviewDto): Promise<Review> {
    const review = await this.findOne(id);
    Object.assign(review, updateReviewDto);
    return review.save();
  }

  async remove(id: string): Promise<{ message: string }> {
    const review = await this.findOne(id);
    await review.deleteOne();
    return { message: 'Review deleted successfully' };
  }
}

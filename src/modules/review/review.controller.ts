import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Review')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a review', description: 'Creates a new customer review. Requires authentication.' })
  async create(@Body() createReviewDto: CreateReviewDto) {
    return this.reviewService.create(createReviewDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reviews', description: 'Retrieves a paginated list of reviews' })
  @ApiQuery({ name: 'page', required: false, example: '1' })
  @ApiQuery({ name: 'limit', required: false, example: '20' })
  @ApiQuery({ name: 'isApproved', required: false, enum: ['true', 'false'] })
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('isApproved') isApproved?: string,
  ) {
    const isApprovedBool = isApproved === 'true' ? true : isApproved === 'false' ? false : undefined;
    return this.reviewService.findAll(parseInt(page, 10), parseInt(limit, 10), isApprovedBool);
  }

  @Get('homepage')
  @ApiOperation({ summary: 'Get homepage reviews', description: 'Retrieves reviews featured on the homepage' })
  @ApiQuery({ name: 'limit', required: false, example: '8' })
  async getHomepageReviews(@Query('limit') limit: string = '8') {
    return this.reviewService.getHomepageReviews(parseInt(limit, 10));
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get review rating summary', description: 'Average rating and total count, optionally scoped to a product/category' })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  async getSummary(
    @Query('productId') productId?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.reviewService.getReviewSummary({ productId, categoryId });
  }

  @Get('scoped')
  @ApiOperation({ summary: 'Get reviews scoped to a product/category', description: 'Used for category/product-page review carousels' })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'page', required: false, example: '1' })
  @ApiQuery({ name: 'limit', required: false, example: '10' })
  async findByScope(
    @Query('productId') productId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.reviewService.findByScope({
      productId,
      categoryId,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get review by ID' })
  @ApiParam({ name: 'id' })
  async findOne(@Param('id') id: string) {
    return this.reviewService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a review', description: 'Requires authentication.' })
  @ApiParam({ name: 'id' })
  async update(@Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto) {
    return this.reviewService.update(id, updateReviewDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a review', description: 'Requires authentication.' })
  @ApiParam({ name: 'id' })
  async remove(@Param('id') id: string) {
    return this.reviewService.remove(id);
  }
}

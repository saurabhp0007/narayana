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
import { OfferService } from './offer.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Offer')
@Controller('offers')
export class OfferController {
  constructor(private readonly offerService: OfferService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new offer',
    description: 'Creates a new promotional offer. Requires authentication.',
  })
  @ApiResponse({
    status: 201,
    description: 'Offer created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid offer data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  async create(@Body() createOfferDto: CreateOfferDto) {
    return this.offerService.create(createOfferDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all offers',
    description: 'Retrieves a paginated list of all offers',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: '1' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: '10' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active status', enum: ['true', 'false'] })
  @ApiResponse({
    status: 200,
    description: 'Offers retrieved successfully',
  })
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('isActive') isActive?: string,
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const isActiveBool = isActive === 'true' ? true : isActive === 'false' ? false : undefined;

    return this.offerService.findAll(pageNum, limitNum, isActiveBool);
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get active offers',
    description: 'Retrieves all currently active promotional offers',
  })
  @ApiResponse({
    status: 200,
    description: 'Active offers retrieved successfully',
  })
  async getActiveOffers() {
    return this.offerService.getActiveOffers();
  }

  @Get('footwear')
  @ApiOperation({
    summary: 'Get footwear section offers',
    description: 'Retrieves offers to be displayed in the homepage Footwear section, grouped by tab',
  })
  @ApiResponse({
    status: 200,
    description: 'Footwear section offers retrieved successfully',
  })
  async getFootwearOffers() {
    return this.offerService.getFootwearOffers();
  }

  @Get('navbar')
  @ApiOperation({
    summary: 'Get navbar offers',
    description: 'Retrieves offers to be displayed in the navigation bar dropdown',
  })
  @ApiResponse({
    status: 200,
    description: 'Navbar offers retrieved successfully',
  })
  async getNavbarOffers() {
    return this.offerService.getNavbarOffers();
  }

  @Get('product/:productId')
  @ApiOperation({
    summary: 'Get offers for product',
    description: 'Retrieves all offers applicable to a specific product',
  })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Product offers retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async getOffersForProduct(@Param('productId') productId: string) {
    return this.offerService.getOffersForProduct(productId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get offer by ID',
    description: 'Retrieves a single offer by its ID',
  })
  @ApiParam({ name: 'id', description: 'Offer ID' })
  @ApiResponse({
    status: 200,
    description: 'Offer retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Offer not found',
  })
  async findOne(@Param('id') id: string) {
    return this.offerService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update an offer',
    description: 'Updates an existing offer. Requires authentication.',
  })
  @ApiParam({ name: 'id', description: 'Offer ID' })
  @ApiResponse({
    status: 200,
    description: 'Offer updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid offer data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 404,
    description: 'Offer not found',
  })
  async update(@Param('id') id: string, @Body() updateOfferDto: Partial<CreateOfferDto>) {
    return this.offerService.update(id, updateOfferDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete an offer',
    description: 'Removes an offer. Requires authentication.',
  })
  @ApiParam({ name: 'id', description: 'Offer ID' })
  @ApiResponse({
    status: 200,
    description: 'Offer deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 404,
    description: 'Offer not found',
  })
  async remove(@Param('id') id: string) {
    return this.offerService.remove(id);
  }
}

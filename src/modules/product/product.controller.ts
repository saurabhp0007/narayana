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
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Product')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new product',
    description: 'Creates a new product in the catalog. Requires authentication.',
  })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid product data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  async create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all products',
    description: 'Retrieves a paginated list of products with optional filters',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: '1' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: '10' })
  @ApiQuery({ name: 'genderId', required: false, description: 'Filter by gender ID' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category ID' })
  @ApiQuery({ name: 'categoryName', required: false, description: 'Filter by category name (case-insensitive, matches across all genders)' })
  @ApiQuery({ name: 'minPrice', required: false, description: 'Minimum price filter' })
  @ApiQuery({ name: 'maxPrice', required: false, description: 'Maximum price filter' })
  @ApiQuery({ name: 'underPriceAmount', required: false, description: 'Filter products under specified price' })
  @ApiQuery({ name: 'inStock', required: false, description: 'Filter by stock availability', enum: ['true', 'false'] })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active status', enum: ['true', 'false'] })
  @ApiQuery({ name: 'search', required: false, description: 'Search term for product name or description' })
  @ApiQuery({ name: 'familySKU', required: false, description: 'Filter by family SKU' })
  @ApiQuery({ name: 'productIds', required: false, description: 'Comma-separated list of product IDs to filter by' })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
  })
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('genderId') genderId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('categoryName') categoryName?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('underPriceAmount') underPriceAmount?: string,
    @Query('inStock') inStock?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('familySKU') familySKU?: string,
    @Query('productIds') productIds?: string,
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const filters: any = {};
    if (genderId) filters.genderId = genderId;
    if (categoryId) filters.categoryId = categoryId;
    if (categoryName) filters.categoryName = categoryName;
    if (minPrice) filters.minPrice = parseFloat(minPrice);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
    if (underPriceAmount) filters.underPriceAmount = parseFloat(underPriceAmount);
    if (inStock === 'true') filters.inStock = true;
    if (isActive === 'true') filters.isActive = true;
    if (isActive === 'false') filters.isActive = false;
    if (search) filters.search = search;
    if (familySKU) filters.familySKU = familySKU;
    if (productIds) filters.productIds = productIds.split(',').filter(id => id.trim());

    return this.productService.findAll(pageNum, limitNum, filters);
  }

  @Get('autosuggest')
  @ApiOperation({
    summary: 'Get product autosuggest',
    description: 'Returns product suggestions based on search query',
  })
  @ApiQuery({ name: 'q', required: true, description: 'Search query string' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of suggestions', example: '10' })
  @ApiResponse({
    status: 200,
    description: 'Suggestions retrieved successfully',
  })
  async autosuggest(@Query('q') query: string, @Query('limit') limit: string = '10') {
    const limitNum = parseInt(limit, 10);
    return this.productService.autosuggest(query, limitNum);
  }

  @Get('featured')
  @ApiOperation({
    summary: 'Get featured products',
    description: 'Retrieves a list of featured products',
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of featured products', example: '12' })
  @ApiResponse({
    status: 200,
    description: 'Featured products retrieved successfully',
  })
  async getFeaturedProducts(@Query('limit') limit: string = '12') {
    const limitNum = parseInt(limit, 10);
    return this.productService.getFeaturedProducts(limitNum);
  }

  @Get('best-sellers')
  @ApiOperation({
    summary: 'Get best-selling products',
    description: 'Retrieves products flagged as best sellers by an admin',
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of best sellers', example: '12' })
  @ApiResponse({
    status: 200,
    description: 'Best sellers retrieved successfully',
  })
  async getBestSellers(@Query('limit') limit: string = '12') {
    const limitNum = parseInt(limit, 10);
    return this.productService.getBestSellers(limitNum);
  }

  @Get('latest-arrivals')
  @ApiOperation({
    summary: 'Get latest arrivals sections',
    description: 'Retrieves categories flagged for the homepage "Latest Arrivals" section, each with its most recent product images',
  })
  @ApiResponse({
    status: 200,
    description: 'Latest arrivals sections retrieved successfully',
  })
  async getLatestArrivals() {
    return this.productService.getLatestArrivalsSections();
  }

  @Get('best-sellers-sections')
  @ApiOperation({
    summary: 'Get best sellers sections',
    description: 'Retrieves best-seller products grouped by category, in the same card shape as Latest Arrivals',
  })
  @ApiResponse({
    status: 200,
    description: 'Best sellers sections retrieved successfully',
  })
  async getBestSellersSections() {
    return this.productService.getBestSellersSections();
  }

  @Get('low-stock')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get low-stock products',
    description: 'Retrieves active products at or below a stock threshold, for admin alerts. Requires authentication.',
  })
  @ApiQuery({ name: 'threshold', required: false, description: 'Stock threshold', example: '5' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum results', example: '10' })
  async getLowStockProducts(
    @Query('threshold') threshold: string = '5',
    @Query('limit') limit: string = '10',
  ) {
    return this.productService.getLowStockProducts(parseInt(threshold, 10), parseInt(limit, 10));
  }

  @Get('by-category/:categoryId')
  @ApiOperation({
    summary: 'Get products by category',
    description: 'Retrieves all products belonging to a specific category',
  })
  @ApiParam({ name: 'categoryId', description: 'Category ID' })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  async getProductsByCategory(@Param('categoryId') categoryId: string) {
    return this.productService.getProductsByCategory(categoryId);
  }

  @Get('homepage-category/:categoryId')
  @ApiOperation({
    summary: 'Get products mapped to a homepage category card',
    description:
      'Retrieves every product that will render under this category\'s homepage Latest Arrivals / Best Sellers card — products whose real categoryId is this category, plus any products explicitly mapped here via homepageCategoryId. Used by the admin "Map Homepage Products" picker.',
  })
  @ApiParam({ name: 'categoryId', description: 'Category ID' })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  async getProductsForHomepageCategory(@Param('categoryId') categoryId: string) {
    return this.productService.getProductsForHomepageCategory(categoryId);
  }

  @Get('by-family/:familySKU')
  @ApiOperation({
    summary: 'Get products by family SKU',
    description: 'Retrieves all product variants sharing the same family SKU',
  })
  @ApiParam({ name: 'familySKU', description: 'Family SKU identifier' })
  @ApiResponse({
    status: 200,
    description: 'Product family retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Product family not found',
  })
  async findByFamilySKU(@Param('familySKU') familySKU: string) {
    return this.productService.findByFamilySKU(familySKU);
  }

  @Get('sku/:sku')
  @ApiOperation({
    summary: 'Get product by SKU',
    description: 'Retrieves a single product by its SKU',
  })
  @ApiParam({ name: 'sku', description: 'Product SKU' })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async findBySKU(@Param('sku') sku: string) {
    return this.productService.findBySKU(sku);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get product by ID',
    description: 'Retrieves a single product by its ID',
  })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update a product',
    description: 'Updates an existing product. Requires authentication.',
  })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid product data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(id, updateProductDto);
  }

  @Patch(':id/stock')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update product stock',
    description: 'Updates the stock quantity of a product. Requires authentication.',
  })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Stock updated successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async updateStock(@Param('id') id: string, @Body('quantity') quantity: number) {
    return this.productService.updateStock(id, quantity);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a product',
    description: 'Removes a product from the catalog. Requires authentication.',
  })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Product deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}

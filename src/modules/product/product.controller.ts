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
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('genderId') genderId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('subcategoryId') subcategoryId?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('underPriceAmount') underPriceAmount?: string,
    @Query('inStock') inStock?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('familySKU') familySKU?: string,
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const filters: any = {};
    if (genderId) filters.genderId = genderId;
    if (categoryId) filters.categoryId = categoryId;
    if (subcategoryId) filters.subcategoryId = subcategoryId;
    if (minPrice) filters.minPrice = parseFloat(minPrice);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
    if (underPriceAmount) filters.underPriceAmount = parseFloat(underPriceAmount);
    if (inStock === 'true') filters.inStock = true;
    if (isActive === 'true') filters.isActive = true;
    if (isActive === 'false') filters.isActive = false;
    if (search) filters.search = search;
    if (familySKU) filters.familySKU = familySKU;

    return this.productService.findAll(pageNum, limitNum, filters);
  }

  @Get('autosuggest')
  async autosuggest(@Query('q') query: string, @Query('limit') limit: string = '10') {
    const limitNum = parseInt(limit, 10);
    return this.productService.autosuggest(query, limitNum);
  }

  @Get('by-category/:categoryId')
  async getProductsByCategory(@Param('categoryId') categoryId: string) {
    return this.productService.getProductsByCategory(categoryId);
  }

  @Get('by-subcategory/:subcategoryId')
  async getProductsBySubcategory(@Param('subcategoryId') subcategoryId: string) {
    return this.productService.getProductsBySubcategory(subcategoryId);
  }

  @Get('by-family/:familySKU')
  async findByFamilySKU(@Param('familySKU') familySKU: string) {
    return this.productService.findByFamilySKU(familySKU);
  }

  @Get('sku/:sku')
  async findBySKU(@Param('sku') sku: string) {
    return this.productService.findBySKU(sku);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(id, updateProductDto);
  }

  @Patch(':id/stock')
  @UseGuards(JwtAuthGuard)
  async updateStock(@Param('id') id: string, @Body('quantity') quantity: number) {
    return this.productService.updateStock(id, quantity);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}

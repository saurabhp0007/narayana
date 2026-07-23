import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ShopCategoryService } from './shop-category.service';
import { CreateShopCategoryDto } from './dto/create-shop-category.dto';
import { UpdateShopCategoryDto } from './dto/update-shop-category.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Shop Category')
@Controller('shop-categories')
export class ShopCategoryController {
  constructor(private readonly shopCategoryService: ShopCategoryService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a homepage "Shop by Category" tab', description: 'Requires authentication.' })
  async create(@Body() dto: CreateShopCategoryDto) {
    return this.shopCategoryService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all shop categories (admin)', description: 'Requires authentication.' })
  async findAll() {
    return this.shopCategoryService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active shop categories', description: 'Public — used by the homepage' })
  async findActive() {
    return this.shopCategoryService.findActive();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get a shop category by ID', description: 'Requires authentication.' })
  @ApiParam({ name: 'id' })
  async findOne(@Param('id') id: string) {
    return this.shopCategoryService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a shop category', description: 'Requires authentication.' })
  @ApiParam({ name: 'id' })
  async update(@Param('id') id: string, @Body() dto: UpdateShopCategoryDto) {
    return this.shopCategoryService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a shop category', description: 'Requires authentication.' })
  @ApiParam({ name: 'id' })
  async remove(@Param('id') id: string) {
    return this.shopCategoryService.remove(id);
  }
}

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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ShopSubcategoryService } from './shop-subcategory.service';
import { CreateShopSubcategoryDto } from './dto/create-shop-subcategory.dto';
import { UpdateShopSubcategoryDto } from './dto/update-shop-subcategory.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Shop Subcategory')
@Controller('shop-subcategories')
export class ShopSubcategoryController {
  constructor(private readonly shopSubcategoryService: ShopSubcategoryService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a shop subcategory', description: 'Requires authentication.' })
  @ApiResponse({ status: 201, description: 'Subcategory created successfully' })
  async create(@Body() dto: CreateShopSubcategoryDto) {
    return this.shopSubcategoryService.create(dto);
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get active shop subcategories',
    description: 'Public — used by the homepage Shop by Category section, grouped by tab',
  })
  async findActive() {
    return this.shopSubcategoryService.findActive();
  }

  @Get('slug/:slug')
  @ApiOperation({
    summary: 'Get an active shop subcategory by slug',
    description: 'Public — used by the subcategory listing page to resolve its mapped product IDs',
  })
  @ApiParam({ name: 'slug' })
  async findBySlug(@Param('slug') slug: string) {
    return this.shopSubcategoryService.findBySlug(slug);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all shop subcategories (admin)', description: 'Requires authentication.' })
  @ApiQuery({ name: 'isActive', required: false, enum: ['true', 'false'] })
  @ApiQuery({ name: 'shopCategoryId', required: false })
  async findAll(@Query('isActive') isActive?: string, @Query('shopCategoryId') shopCategoryId?: string) {
    const isActiveBool = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.shopSubcategoryService.findAll(isActiveBool, shopCategoryId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get a shop subcategory by ID', description: 'Requires authentication.' })
  @ApiParam({ name: 'id' })
  async findOne(@Param('id') id: string) {
    return this.shopSubcategoryService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a shop subcategory', description: 'Requires authentication.' })
  @ApiParam({ name: 'id' })
  async update(@Param('id') id: string, @Body() dto: UpdateShopSubcategoryDto) {
    return this.shopSubcategoryService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a shop subcategory', description: 'Requires authentication.' })
  @ApiParam({ name: 'id' })
  async remove(@Param('id') id: string) {
    return this.shopSubcategoryService.remove(id);
  }
}

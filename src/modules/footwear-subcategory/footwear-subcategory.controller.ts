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
import { FootwearSubcategoryService } from './footwear-subcategory.service';
import { CreateFootwearSubcategoryDto } from './dto/create-footwear-subcategory.dto';
import { UpdateFootwearSubcategoryDto } from './dto/update-footwear-subcategory.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Footwear Subcategory')
@Controller('footwear-subcategories')
export class FootwearSubcategoryController {
  constructor(private readonly footwearSubcategoryService: FootwearSubcategoryService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a footwear subcategory', description: 'Requires authentication.' })
  @ApiResponse({ status: 201, description: 'Subcategory created successfully' })
  async create(@Body() dto: CreateFootwearSubcategoryDto) {
    return this.footwearSubcategoryService.create(dto);
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get active footwear subcategories',
    description: 'Public — used by the homepage Footwear section, grouped by tab',
  })
  async findActive() {
    return this.footwearSubcategoryService.findActive();
  }

  @Get('slug/:slug')
  @ApiOperation({
    summary: 'Get an active footwear subcategory by slug',
    description: 'Public — used by the subcategory listing page to resolve its mapped product IDs',
  })
  @ApiParam({ name: 'slug' })
  async findBySlug(@Param('slug') slug: string) {
    return this.footwearSubcategoryService.findBySlug(slug);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all footwear subcategories (admin)', description: 'Requires authentication.' })
  @ApiQuery({ name: 'isActive', required: false, enum: ['true', 'false'] })
  @ApiQuery({ name: 'tabName', required: false })
  async findAll(@Query('isActive') isActive?: string, @Query('tabName') tabName?: string) {
    const isActiveBool = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.footwearSubcategoryService.findAll(isActiveBool, tabName);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get a footwear subcategory by ID', description: 'Requires authentication.' })
  @ApiParam({ name: 'id' })
  async findOne(@Param('id') id: string) {
    return this.footwearSubcategoryService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a footwear subcategory', description: 'Requires authentication.' })
  @ApiParam({ name: 'id' })
  async update(@Param('id') id: string, @Body() dto: UpdateFootwearSubcategoryDto) {
    return this.footwearSubcategoryService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a footwear subcategory', description: 'Requires authentication.' })
  @ApiParam({ name: 'id' })
  async remove(@Param('id') id: string) {
    return this.footwearSubcategoryService.remove(id);
  }
}

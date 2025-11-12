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
import { SubcategoryService } from './subcategory.service';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('subcategory')
@UseGuards(JwtAuthGuard)
export class SubcategoryController {
  constructor(private readonly subcategoryService: SubcategoryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createSubcategoryDto: CreateSubcategoryDto) {
    return this.subcategoryService.create(createSubcategoryDto);
  }

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('categoryId') categoryId?: string,
    @Query('isActive') isActive?: string,
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const isActiveBool = isActive === 'true' ? true : isActive === 'false' ? false : undefined;

    return this.subcategoryService.findAll(pageNum, limitNum, categoryId, isActiveBool);
  }

  @Get('by-category/:categoryId')
  async findByCategory(@Param('categoryId') categoryId: string) {
    return this.subcategoryService.findByCategory(categoryId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.subcategoryService.findOne(id);
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string, @Query('categoryId') categoryId?: string) {
    return this.subcategoryService.findBySlug(slug, categoryId);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateSubcategoryDto: UpdateSubcategoryDto) {
    return this.subcategoryService.update(id, updateSubcategoryDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    return this.subcategoryService.remove(id);
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { HeroBannerService } from './hero-banner.service';
import { CreateHeroBannerDto } from './dto/create-hero-banner.dto';
import { UpdateHeroBannerDto } from './dto/update-hero-banner.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Hero Banner')
@Controller('hero-banners')
export class HeroBannerController {
  constructor(private readonly heroBannerService: HeroBannerService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a hero banner slide', description: 'Requires authentication.' })
  async create(@Body() dto: CreateHeroBannerDto) {
    return this.heroBannerService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all hero banners (admin)', description: 'Requires authentication.' })
  async findAll() {
    return this.heroBannerService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active hero banners', description: 'Public — used by the homepage carousel' })
  async findActive() {
    return this.heroBannerService.findActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a hero banner by ID' })
  @ApiParam({ name: 'id' })
  async findOne(@Param('id') id: string) {
    return this.heroBannerService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a hero banner', description: 'Requires authentication.' })
  @ApiParam({ name: 'id' })
  async update(@Param('id') id: string, @Body() dto: UpdateHeroBannerDto) {
    return this.heroBannerService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a hero banner', description: 'Requires authentication.' })
  @ApiParam({ name: 'id' })
  async remove(@Param('id') id: string) {
    return this.heroBannerService.remove(id);
  }
}

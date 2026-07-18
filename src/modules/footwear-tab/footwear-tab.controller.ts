import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { FootwearTabService } from './footwear-tab.service';
import { CreateFootwearTabDto } from './dto/create-footwear-tab.dto';
import { UpdateFootwearTabDto } from './dto/update-footwear-tab.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Footwear Tab')
@Controller('footwear-tabs')
export class FootwearTabController {
  constructor(private readonly footwearTabService: FootwearTabService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a footwear section tab', description: 'Requires authentication.' })
  @ApiResponse({ status: 201, description: 'Tab created successfully' })
  async create(@Body() createDto: CreateFootwearTabDto) {
    return this.footwearTabService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all footwear section tabs' })
  @ApiQuery({ name: 'isActive', required: false, enum: ['true', 'false'] })
  @ApiResponse({ status: 200, description: 'Tabs retrieved successfully' })
  async findAll(@Query('isActive') isActive?: string) {
    const isActiveBool = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.footwearTabService.findAll(isActiveBool);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a footwear section tab by ID' })
  @ApiParam({ name: 'id', description: 'Footwear tab ID' })
  @ApiResponse({ status: 200, description: 'Tab retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Tab not found' })
  async findOne(@Param('id') id: string) {
    return this.footwearTabService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a footwear section tab', description: 'Requires authentication.' })
  @ApiParam({ name: 'id', description: 'Footwear tab ID' })
  @ApiResponse({ status: 200, description: 'Tab updated successfully' })
  @ApiResponse({ status: 404, description: 'Tab not found' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateFootwearTabDto) {
    return this.footwearTabService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a footwear section tab', description: 'Requires authentication.' })
  @ApiParam({ name: 'id', description: 'Footwear tab ID' })
  @ApiResponse({ status: 200, description: 'Tab deleted successfully' })
  @ApiResponse({ status: 404, description: 'Tab not found' })
  async remove(@Param('id') id: string) {
    return this.footwearTabService.remove(id);
  }
}

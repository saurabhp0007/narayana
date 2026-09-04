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
import { SizeGroupService } from './size-group.service';
import { CreateSizeGroupDto } from './dto/create-size-group.dto';
import { UpdateSizeGroupDto } from './dto/update-size-group.dto';
import { SizeValueDto } from './dto/size-value.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Size Group')
@Controller('size-groups')
export class SizeGroupController {
  constructor(private readonly sizeGroupService: SizeGroupService) {}

  @Get()
  @ApiOperation({
    summary: 'Get size groups',
    description: 'Returns the size vocabularies offered in the admin product Sizes & Stock picker',
  })
  @ApiQuery({ name: 'onlyActive', required: false, enum: ['true', 'false'] })
  async findAll(@Query('onlyActive') onlyActive?: string) {
    return this.sizeGroupService.findAll(onlyActive === 'true');
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get a size group by ID', description: 'Requires authentication.' })
  @ApiParam({ name: 'id' })
  async findOne(@Param('id') id: string) {
    return this.sizeGroupService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a size group', description: 'Requires authentication.' })
  async create(@Body() dto: CreateSizeGroupDto) {
    return this.sizeGroupService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a size group', description: 'Requires authentication.' })
  @ApiParam({ name: 'id' })
  async update(@Param('id') id: string, @Body() dto: UpdateSizeGroupDto) {
    return this.sizeGroupService.update(id, dto);
  }

  @Post(':id/sizes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add a size to a group', description: 'Requires authentication.' })
  @ApiParam({ name: 'id' })
  async addSize(@Param('id') id: string, @Body() dto: SizeValueDto) {
    return this.sizeGroupService.addSize(id, dto.size);
  }

  @Delete(':id/sizes/:size')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Remove a size from a group', description: 'Requires authentication.' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'size' })
  async removeSize(@Param('id') id: string, @Param('size') size: string) {
    return this.sizeGroupService.removeSize(id, decodeURIComponent(size));
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a size group', description: 'Requires authentication.' })
  @ApiParam({ name: 'id' })
  async remove(@Param('id') id: string) {
    return this.sizeGroupService.remove(id);
  }
}

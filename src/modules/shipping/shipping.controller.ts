import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ShippingService } from './shipping.service';
import { CreateShippingRuleDto, UpdateShippingRuleDto } from './dto/shipping-rule.dto';

@ApiTags('Shipping')
@Controller('shipping-rules')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get()
  @ApiOperation({ summary: 'List shipping rules (admin)' })
  findAll() {
    return this.shippingService.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a shipping rule' })
  create(@Body() dto: CreateShippingRuleDto) {
    return this.shippingService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a shipping rule' })
  @ApiParam({ name: 'id' })
  update(@Param('id') id: string, @Body() dto: UpdateShippingRuleDto) {
    return this.shippingService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a shipping rule' })
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string) {
    return this.shippingService.remove(id);
  }
}

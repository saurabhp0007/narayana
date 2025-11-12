import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { OfferService } from './offer.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('offers')
@UseGuards(JwtAuthGuard)
export class OfferController {
  constructor(private readonly offerService: OfferService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createOfferDto: CreateOfferDto) {
    return this.offerService.create(createOfferDto);
  }

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('isActive') isActive?: string,
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const isActiveBool = isActive === 'true' ? true : isActive === 'false' ? false : undefined;

    return this.offerService.findAll(pageNum, limitNum, isActiveBool);
  }

  @Get('active')
  async getActiveOffers() {
    return this.offerService.getActiveOffers();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.offerService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateOfferDto: Partial<CreateOfferDto>) {
    return this.offerService.update(id, updateOfferDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    return this.offerService.remove(id);
  }
}

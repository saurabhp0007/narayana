import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateHomepageSettingsDto } from './dto/update-homepage-settings.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('homepage')
  @ApiOperation({ summary: 'Get homepage settings', description: 'Public homepage display toggles (e.g. countdown timer)' })
  async getHomepageSettings() {
    return this.settingsService.getHomepageSettings();
  }

  @Patch('homepage')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update homepage settings', description: 'Requires authentication.' })
  async updateHomepageSettings(@Body() dto: UpdateHomepageSettingsDto) {
    return this.settingsService.updateHomepageSettings(dto);
  }
}

import { IsOptional, IsBoolean, IsDateString, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateHomepageSettingsDto {
  @ApiPropertyOptional({ description: 'Whether the homepage countdown timer is shown', example: true })
  @IsOptional()
  @IsBoolean()
  countdownEnabled?: boolean;

  @ApiPropertyOptional({ description: 'When the countdown ends (ISO 8601)', example: '2026-08-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  countdownEndDate?: string;

  @ApiPropertyOptional({ description: 'Label shown above the countdown, e.g. "Mega Sale"', example: 'Mega Sale' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  countdownLabel?: string;

  @ApiPropertyOptional({ description: 'Whether the top announcement bar is shown', example: true })
  @IsOptional()
  @IsBoolean()
  announcementBarEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Top announcement bar text', example: 'UP TO 90% OFF BEST-SELLING ITEMS' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  announcementBarText?: string;
}

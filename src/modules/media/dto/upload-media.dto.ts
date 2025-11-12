import { IsString, IsOptional, IsIn } from 'class-validator';

export class UploadMediaDto {
  @IsOptional()
  @IsString()
  @IsIn(['products', 'banners', 'sliders', 'categories', 'general'])
  folder?: string;
}

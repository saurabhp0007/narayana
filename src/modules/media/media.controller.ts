import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  /**
   * Upload a single file
   */
  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
      fileFilter: (req, file, cb) => {
        // Allow images and videos
        const allowedMimes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/webp',
          'video/mp4',
          'video/mpeg',
          'video/quicktime',
        ];

        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Invalid file type. Only images (jpg, png, gif, webp) and videos (mp4, mpeg, mov) are allowed.',
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.mediaService.uploadFile(file, folder || 'products');
  }

  /**
   * Upload multiple files
   */
  @Post('upload-multiple')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      // Max 10 files
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
      },
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/webp',
          'video/mp4',
          'video/mpeg',
          'video/quicktime',
        ];

        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Invalid file type. Only images (jpg, png, gif, webp) and videos (mp4, mpeg, mov) are allowed.',
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('folder') folder?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    return this.mediaService.uploadMultipleFiles(files, folder || 'products');
  }

  /**
   * List files in ImageKit
   */
  @Get('list')
  async listFiles(
    @Query('folder') folder?: string,
    @Query('limit') limit: string = '50',
    @Query('skip') skip: string = '0',
  ) {
    const limitNum = parseInt(limit, 10);
    const skipNum = parseInt(skip, 10);

    return this.mediaService.listFiles(folder, limitNum, skipNum);
  }

  /**
   * Get file details
   */
  @Get('details/:fileId')
  async getFileDetails(@Param('fileId') fileId: string) {
    return this.mediaService.getFileDetails(fileId);
  }

  /**
   * Get authentication parameters for client-side upload
   */
  @Get('auth')
  async getAuthParams() {
    return this.mediaService.getAuthenticationParameters();
  }

  /**
   * Delete a file from ImageKit
   */
  @Delete(':fileId')
  @HttpCode(HttpStatus.OK)
  async deleteFile(@Param('fileId') fileId: string) {
    await this.mediaService.deleteFile(fileId);
    return { message: 'File deleted successfully' };
  }

  /**
   * Delete multiple files from ImageKit
   */
  @Delete()
  @HttpCode(HttpStatus.OK)
  async deleteMultipleFiles(@Body('fileIds') fileIds: string[]) {
    if (!fileIds || fileIds.length === 0) {
      throw new BadRequestException('No file IDs provided');
    }

    await this.mediaService.deleteMultipleFiles(fileIds);
    return { message: `${fileIds.length} file(s) deleted successfully` };
  }
}

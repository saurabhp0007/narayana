import {
  Controller,
  Post,
  Delete,
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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Media')
@Controller('media')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Upload a single file',
    description: 'Uploads a single image or video file to the media storage',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload (jpg, png, gif, webp, mp4, mpeg, mov)',
        },
      },
    },
  })
  @ApiQuery({ name: 'folder', required: false, description: 'Target folder for the file', example: 'products' })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid file type or no file provided',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
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

  @Post('upload-multiple')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Upload multiple files',
    description: 'Uploads multiple image or video files to the media storage (max 10 files)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Files to upload (max 10, jpg, png, gif, webp, mp4, mpeg, mov)',
        },
      },
    },
  })
  @ApiQuery({ name: 'folder', required: false, description: 'Target folder for the files', example: 'products' })
  @ApiResponse({
    status: 201,
    description: 'Files uploaded successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid file type or no files provided',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
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

  @Delete(':fileId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a file',
    description: 'Deletes a single file from the media storage',
  })
  @ApiParam({ name: 'fileId', description: 'File ID to delete' })
  @ApiResponse({
    status: 200,
    description: 'File deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 404,
    description: 'File not found',
  })
  async deleteFile(@Param('fileId') fileId: string) {
    await this.mediaService.deleteFile(fileId);
    return { message: 'File deleted successfully' };
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete multiple files',
    description: 'Deletes multiple files from the media storage',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fileIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of file IDs to delete',
        },
      },
      required: ['fileIds'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Files deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - No file IDs provided',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  async deleteMultipleFiles(@Body('fileIds') fileIds: string[]) {
    if (!fileIds || fileIds.length === 0) {
      throw new BadRequestException('No file IDs provided');
    }

    await this.mediaService.deleteMultipleFiles(fileIds);
    return { message: `${fileIds.length} file(s) deleted successfully` };
  }
}

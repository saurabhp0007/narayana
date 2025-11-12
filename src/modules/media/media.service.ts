import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ImageKit from 'imagekit';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private imagekit: ImageKit;

  constructor(private configService: ConfigService) {
    const publicKey = this.configService.get<string>('imagekit.publicKey');
    const privateKey = this.configService.get<string>('imagekit.privateKey');
    const urlEndpoint = this.configService.get<string>('imagekit.urlEndpoint');

    if (!publicKey || !privateKey || !urlEndpoint) {
      this.logger.warn('ImageKit credentials not configured. Media upload will not be available.');
      return;
    }

    this.imagekit = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint,
    });

    this.logger.log('ImageKit initialized successfully');
  }

  /**
   * Upload a single file to ImageKit
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'products',
  ): Promise<{
    url: string;
    fileId: string;
    name: string;
    size: number;
    filePath: string;
  }> {
    if (!this.imagekit) {
      throw new BadRequestException('ImageKit is not configured');
    }

    try {
      const result = await this.imagekit.upload({
        file: file.buffer.toString('base64'),
        fileName: file.originalname,
        folder: folder,
        useUniqueFileName: true,
      });

      this.logger.log(`File uploaded successfully: ${result.fileId}`);

      return {
        url: result.url,
        fileId: result.fileId,
        name: result.name,
        size: result.size,
        filePath: result.filePath,
      };
    } catch (error) {
      this.logger.error(`File upload failed: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Upload multiple files to ImageKit
   */
  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: string = 'products',
  ): Promise<
    Array<{
      url: string;
      fileId: string;
      name: string;
      size: number;
      filePath: string;
    }>
  > {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const uploadPromises = files.map((file) => this.uploadFile(file, folder));
    return Promise.all(uploadPromises);
  }

  /**
   * Delete a file from ImageKit
   */
  async deleteFile(fileId: string): Promise<void> {
    if (!this.imagekit) {
      throw new BadRequestException('ImageKit is not configured');
    }

    try {
      await this.imagekit.deleteFile(fileId);
      this.logger.log(`File deleted successfully: ${fileId}`);
    } catch (error) {
      this.logger.error(`File deletion failed: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Delete multiple files from ImageKit
   */
  async deleteMultipleFiles(fileIds: string[]): Promise<void> {
    if (!fileIds || fileIds.length === 0) {
      return;
    }

    const deletePromises = fileIds.map((fileId) => this.deleteFile(fileId));
    await Promise.all(deletePromises);
  }

  /**
   * List files from ImageKit
   */
  async listFiles(folder?: string, limit: number = 50, skip: number = 0): Promise<any> {
    if (!this.imagekit) {
      throw new BadRequestException('ImageKit is not configured');
    }

    try {
      const options: any = {
        limit,
        skip,
      };

      if (folder) {
        options.path = folder;
      }

      const result = await this.imagekit.listFiles(options);
      return result;
    } catch (error) {
      this.logger.error(`List files failed: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to list files: ${error.message}`);
    }
  }

  /**
   * Get file details from ImageKit
   */
  async getFileDetails(fileId: string): Promise<any> {
    if (!this.imagekit) {
      throw new BadRequestException('ImageKit is not configured');
    }

    try {
      const result = await this.imagekit.getFileDetails(fileId);
      return result;
    } catch (error) {
      this.logger.error(`Get file details failed: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to get file details: ${error.message}`);
    }
  }

  /**
   * Get authentication parameters for client-side upload
   */
  getAuthenticationParameters(): any {
    if (!this.imagekit) {
      throw new BadRequestException('ImageKit is not configured');
    }

    return this.imagekit.getAuthenticationParameters();
  }
}

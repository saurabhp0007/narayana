import { Injectable, BadRequestException, NotFoundException, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { promises as fs, constants as fsConstants } from 'fs';
import * as path from 'path';
import sharp from 'sharp';

export const IMAGE_VARIANT_WIDTHS = [400, 800] as const;
const MAX_IMAGE_WIDTH = 1600;
const WEBP_QUALITY = 80;

export interface UploadedMedia {
  url: string;
  fileId: string;
  name: string;
  size: number;
  filePath: string;
}

@Injectable()
export class MediaService implements OnModuleInit {
  private readonly logger = new Logger(MediaService.name);
  private readonly root: string;
  private readonly baseUrl: string;

  constructor(configService: ConfigService) {
    this.root = path.resolve(configService.get<string>('media.dir') || 'uploads');
    this.baseUrl = (configService.get<string>('media.url') || '').replace(/\/$/, '');
  }

  async onModuleInit() {
    try {
      await fs.mkdir(this.root, { recursive: true });
      await fs.access(this.root, fsConstants.W_OK);
      this.logger.log(`Media storage ready at ${this.root}`);
    } catch (error) {
      this.logger.error(`Media storage not writable at ${this.root}: ${error.message}`);
    }
  }

  async uploadFile(file: Express.Multer.File, folder = 'products'): Promise<UploadedMedia> {
    const dir = this.safePath(folder);
    await fs.mkdir(dir, { recursive: true });
    const stem = `${this.slug(path.parse(file.originalname).name)}_${randomBytes(5).toString('hex')}`;

    try {
      const isResizable = file.mimetype.startsWith('image/') && file.mimetype !== 'image/gif';
      const name = isResizable ? `${stem}.webp` : `${stem}${path.extname(file.originalname).toLowerCase()}`;
      let size = file.size;

      if (isResizable) {
        const image = sharp(file.buffer).rotate();
        const full = await image.clone().resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true }).webp({ quality: WEBP_QUALITY }).toBuffer();
        await fs.writeFile(path.join(dir, name), full);
        size = full.length;
        await Promise.all(
          IMAGE_VARIANT_WIDTHS.map((width) =>
            image
              .clone()
              .resize({ width, withoutEnlargement: true })
              .webp({ quality: WEBP_QUALITY })
              .toFile(path.join(dir, `${stem}-w${width}.webp`)),
          ),
        );
      } else {
        await fs.writeFile(path.join(dir, name), file.buffer);
      }

      const filePath = path.posix.join(folder, name);
      this.logger.log(`File stored: ${filePath}`);
      return { url: `${this.baseUrl}/${filePath}`, fileId: filePath, name, size, filePath: `/${filePath}` };
    } catch (error) {
      this.logger.error(`File upload failed: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  async uploadMultipleFiles(files: Express.Multer.File[], folder = 'products'): Promise<UploadedMedia[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }
    return Promise.all(files.map((file) => this.uploadFile(file, folder)));
  }

  async deleteFile(fileId: string): Promise<void> {
    const file = this.safePath(fileId);
    const { dir, name, ext } = path.parse(file);
    const variants = ext === '.webp' ? IMAGE_VARIANT_WIDTHS.map((w) => path.join(dir, `${name}-w${w}.webp`)) : [];

    try {
      await fs.unlink(file);
    } catch {
      throw new NotFoundException(`File not found: ${fileId}`);
    }
    await Promise.all(variants.map((v) => fs.unlink(v).catch(() => undefined)));
    this.logger.log(`File deleted: ${fileId}`);
  }

  async deleteMultipleFiles(fileIds: string[]): Promise<void> {
    await Promise.all((fileIds || []).map((fileId) => this.deleteFile(fileId)));
  }

  private safePath(relative: string): string {
    const resolved = path.resolve(this.root, relative.replace(/^\/+/, ''));
    if (resolved !== this.root && !resolved.startsWith(this.root + path.sep)) {
      throw new BadRequestException('Invalid path');
    }
    return resolved;
  }

  private slug(name: string): string {
    return name.replace(/[^a-zA-Z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'file';
  }
}

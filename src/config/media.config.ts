import { registerAs } from '@nestjs/config';

export default registerAs('media', () => ({
  dir: process.env.MEDIA_DIR || 'uploads',
  url: process.env.MEDIA_URL || '',
}));

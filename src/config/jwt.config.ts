import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'default-secret-key',
  expiresIn: process.env.JWT_EXPIRATION || '24h',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-key',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
}));

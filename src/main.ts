import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import compression from 'compression';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port');
  const apiPrefix = configService.get<string>('app.apiPrefix');
  const nodeEnv = configService.get<string>('app.nodeEnv');

  // Security: Helmet middleware
  app.use(helmet());

  // Performance: Compression middleware
  app.use(compression());

  // Global prefix for all routes
  app.setGlobalPrefix(apiPrefix);

  // Enable CORS
  app.enableCors({
    origin: nodeEnv === 'production' ? process.env.ALLOWED_ORIGINS?.split(',') : true,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Graceful shutdown
  app.enableShutdownHooks();

  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}/${apiPrefix}`);
  logger.log(`🌍 Environment: ${nodeEnv}`);
  logger.log(`🔒 Security: Helmet enabled`);
  logger.log(`⚡ Compression: Enabled`);
}

bootstrap();

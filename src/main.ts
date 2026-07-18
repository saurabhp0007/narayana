import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
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

  // Swagger API Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Narayana eCommerce CMS API')
    .setDescription('Complete API documentation for eCommerce CMS Backend - includes User, Admin, Product, Category, Gender, Cart, Wishlist, Order, and Offer management')
    .setVersion('2.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Health', 'Health check endpoints')
    .addTag('Auth', 'Admin authentication endpoints')
    .addTag('Admin', 'Admin profile management')
    .addTag('User', 'User registration, authentication, profile, and address management')
    .addTag('Gender', 'Gender CRUD operations')
    .addTag('Category', 'Category CRUD operations')
    .addTag('Product', 'Product CRUD operations with search and filtering')
    .addTag('Cart', 'Shopping cart management')
    .addTag('Wishlist', 'User wishlist management')
    .addTag('Order', 'Order creation and management')
    .addTag('Offer', 'Promotional offers and discounts')
    .addTag('Media', 'File upload and management')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'Narayana eCommerce API Docs',
  });

  // Enable CORS
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // In development, allow all origins
      if (nodeEnv !== 'production') {
        return callback(null, true);
      }

      // In production, check against allowed origins
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
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
  logger.log(`📚 Swagger API Docs: http://localhost:${port}/api-docs`);
  logger.log(`🌍 Environment: ${nodeEnv}`);
  logger.log(`🔒 Security: Helmet enabled`);
  logger.log(`⚡ Compression: Enabled`);
}

bootstrap();

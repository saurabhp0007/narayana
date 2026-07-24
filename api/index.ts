import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import compression from 'compression';
import helmet from 'helmet';
import { Express } from 'express';

let cachedApp: Express;

async function createApp() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(compression());
  app.setGlobalPrefix('api');

  // Express auto-generates an ETag per JSON response by default. When a client resends the
  // same request, this causes a 304 Not Modified carrying the OLD cached body instead of
  // fresh data — invisible in most flows, but it breaks admin screens that need to see the
  // result of a write immediately after making it. Disable it store-wide; the app already
  // has its own Redis-backed caching for performance, so this isn't needed for that either.
  app.getHttpAdapter().getInstance().set('etag', false);

  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (process.env.NODE_ENV !== 'production') return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.init();
  return app.getHttpAdapter().getInstance();
}

export default async function handler(req: any, res: any) {
  if (!cachedApp) {
    cachedApp = await createApp();
  }
  cachedApp(req, res);
}

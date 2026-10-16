import { NestFactory } from '@nestjs/core';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import express from 'express';
import path from 'path';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  app.use(cookieParser());
  app.use(
    '/uploads',
    express.static(path.resolve(process.cwd(), 'uploads')),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // All API routes live under /api/v1 — except the root landing page.
  app.setGlobalPrefix('api/v1', {
    exclude: [{ path: '/', method: RequestMethod.GET }],
  });

  const allowedOrigins = (
    process.env.CLIENT_URL ??
    process.env.CLIENT_ORIGIN ??
    'http://localhost:3000'
  )
    .split(',')
    .map((origin) => origin.trim());

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  await app.listen(Number(process.env.PORT) || 5000);
}
await bootstrap();

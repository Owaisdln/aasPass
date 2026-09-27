import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configuredOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const localOrigin = /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/i;

  app.enableCors({
    origin: (origin, callback) => {
      const allowed = !origin
        || configuredOrigins.includes(origin)
        || (isDevelopment && localOrigin.test(origin));
      callback(allowed ? null : new Error('Origin is not allowed by CORS'), allowed);
    },
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 3000);

  await app.listen(port);

  console.log(`Server running on http://localhost:${port}`);
}

bootstrap();
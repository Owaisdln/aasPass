import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { isCorsOriginAllowed } from './common/cors-origin';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: (origin, callback) => {
      const allowed = isCorsOriginAllowed(origin);
      callback(
        allowed ? null : new Error('Origin is not allowed by CORS'),
        allowed,
      );
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

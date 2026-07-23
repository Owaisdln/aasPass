import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import configuration from './config';
import { validate } from './config/env.validation';

import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      envFilePath: '.env',
      load: configuration,
      validate,
    }),
    PrismaModule,
  ],
})
export class AppModule {}
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import configuration from './config';
import { validate } from './config/env.validation';

import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { SupabaseModule } from './infrastructure/supabase/supabase.module';

import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';

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
    SupabaseModule,
    AuthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
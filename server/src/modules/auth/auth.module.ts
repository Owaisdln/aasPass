import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { SupabaseModule } from '../../infrastructure/supabase/supabase.module';

import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';

@Module({
  imports: [JwtModule.register({}), PrismaModule, SupabaseModule],
  controllers: [AuthController],
  providers: [AuthService, SupabaseAuthGuard],
  exports: [AuthService, SupabaseAuthGuard],
})
export class AuthModule {}

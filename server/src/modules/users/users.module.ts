import { Module } from '@nestjs/common';

import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

import { UsersController } from './controllers/users.controller';
import { UserMapper } from './mappers/user.mapper';
import { UsersService } from './services/users.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
  ],
  controllers: [
    UsersController,
  ],
  providers: [
    UsersService,
    UserMapper,
  ],
})
export class UsersModule {}
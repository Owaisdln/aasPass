import { Module } from '@nestjs/common';

import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

import { PermissionsProvider } from './interfaces/permissions-provider.interface';
import { PrismaPermissionsProvider } from './providers/prisma-permissions.provider';
import { AnyPermissionGuard } from './guards/any-permission.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [PrismaModule],
  providers: [
    RolesGuard,
    PermissionsGuard,
    AnyPermissionGuard,
    {
      provide: PermissionsProvider,
      useClass: PrismaPermissionsProvider,
    },
  ],
  exports: [
    RolesGuard,
    PermissionsGuard,
    AnyPermissionGuard,
    PermissionsProvider,
  ],
})
export class AuthorizationModule {}
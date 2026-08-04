import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { PermissionsProvider } from '../interfaces/permissions-provider.interface';

@Injectable()
export class PrismaPermissionsProvider
  extends PermissionsProvider
{
  constructor(
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async getPermissionsForRole(
    roleId: string,
  ): Promise<string[]> {
    const role =
      await this.prisma.role.findUnique({
        where: {
          id: roleId,
        },
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      });

    if (!role) {
      return [];
    }

    return role.rolePermissions.map(
      (rolePermission) =>
        rolePermission.permission.code,
    );
  }
}
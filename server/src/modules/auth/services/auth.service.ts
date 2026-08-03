import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { UserStatus } from '@prisma/client';
import { User } from '@supabase/supabase-js';

import { CurrentUser } from '../../../common/identity/current-user.model';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { SupabaseService } from '../../../infrastructure/supabase/supabase.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async authenticate(accessToken: string): Promise<CurrentUser> {
    const supabaseUser =
      await this.supabaseService.verifyAccessToken(accessToken);

    let applicationUser = await this.prisma.user.findUnique({
      where: {
        id: supabaseUser.id,
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!applicationUser) {
      applicationUser = await this.syncUser(supabaseUser);
    }

    if (applicationUser.status === UserStatus.BLOCKED) {
      throw new UnauthorizedException(
        'Your account has been blocked.',
      );
    }

    const permissions =
      applicationUser.role.rolePermissions.map(
        (rolePermission) => rolePermission.permission.code,
      );

    return new CurrentUser(
      applicationUser.id,
      applicationUser.email,
      applicationUser.phone,
      applicationUser.roleId,
      applicationUser.role.code,
      permissions,
      applicationUser.status,
    );
  }

  private async syncUser(
    supabaseUser: User,
  ) {
    const customerRole =
      await this.prisma.role.findFirst({
        where: {
          code: 'CUSTOMER',
        },
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      });

    if (!customerRole) {
      throw new NotFoundException(
        'Default customer role not found.',
      );
    }

    return this.prisma.user.create({
      data: {
        id: supabaseUser.id,
        email: supabaseUser.email,
        phone: supabaseUser.phone,
        firstName: '',
        lastName: '',
        status: UserStatus.ACTIVE,
        roleId: customerRole.id,
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });
  }
}
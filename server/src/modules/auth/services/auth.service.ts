import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { UserStatus } from '@prisma/client';
import { User } from '@supabase/supabase-js';
import { JwtService } from '@nestjs/jwt';
import { createHmac } from 'node:crypto';

import { CurrentUser } from '../../../common/identity/current-user.model';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { SupabaseService } from '../../../infrastructure/supabase/supabase.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseService: SupabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async authenticate(accessToken: string): Promise<CurrentUser> {
    if (accessToken.startsWith('demo.')) {
      return this.authenticateDemoSession(accessToken.slice('demo.'.length));
    }

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
      throw new UnauthorizedException('Your account has been blocked.');
    }

    return this.toCurrentUser(applicationUser);
  }

  async listDemoUsers() {
    this.assertDemoMode();
    return this.prisma.user.findMany({
      where: {
        email: { endsWith: '@aaspass.test' },
        status: UserStatus.ACTIVE,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
      orderBy: [{ firstName: 'asc' }, { email: 'asc' }],
    });
  }

  async createDemoSession(email: string) {
    this.assertDemoMode();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.endsWith('@aaspass.test')) {
      throw new UnauthorizedException(
        'Choose an active demo account from the list.',
      );
    }
    const user = await this.prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        status: UserStatus.ACTIVE,
        deletedAt: null,
      },
      select: { id: true, email: true },
    });
    if (!user) {
      throw new UnauthorizedException(
        'Choose an active demo account from the list.',
      );
    }

    const token = await this.jwtService.signAsync(
      { sub: user.id, demo: true },
      {
        secret: this.demoSigningSecret(),
        issuer: 'aaspass-demo',
        audience: 'aaspass-api',
        expiresIn: '12h',
      },
    );
    return {
      access_token: `demo.${token}`,
      token_type: 'bearer',
      expires_in: 43200,
      user,
    };
  }

  private async authenticateDemoSession(token: string): Promise<CurrentUser> {
    this.assertDemoMode();

    let payload: { sub?: string; demo?: boolean };
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: this.demoSigningSecret(),
        issuer: 'aaspass-demo',
        audience: 'aaspass-api',
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired demo session.');
    }
    if (!payload.demo || !payload.sub) {
      throw new UnauthorizedException('Invalid demo session.');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, status: UserStatus.ACTIVE, deletedAt: null },
      include: {
        role: {
          include: {
            rolePermissions: { include: { permission: true } },
          },
        },
      },
    });
    if (!user) {
      throw new UnauthorizedException('Demo account is no longer active.');
    }
    return this.toCurrentUser(user);
  }

  private toCurrentUser(user: {
    id: string;
    email: string | null;
    phone: string | null;
    roleId: string;
    role: {
      code: string;
      rolePermissions: { permission: { code: string } }[];
    };
    status: UserStatus;
  }): CurrentUser {
    return new CurrentUser(
      user.id,
      user.email,
      user.phone,
      user.roleId,
      user.role.code,
      user.role.rolePermissions.map(({ permission }) => permission.code),
      user.status,
    );
  }

  private assertDemoMode(): void {
    if (process.env.NODE_ENV === 'production') {
      throw new NotFoundException();
    }
  }

  private demoSigningSecret(): string {
    const serviceRoleKey = this.configService.getOrThrow<string>(
      'supabase.serviceRoleKey',
    );
    return createHmac('sha256', serviceRoleKey)
      .update('aaspass-development-demo-session-v1')
      .digest('hex');
  }

  private async syncUser(supabaseUser: User) {
    const customerRole = await this.prisma.role.findFirst({
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
      throw new NotFoundException('Default customer role not found.');
    }

    return this.prisma.user.create({
      data: {
        id: supabaseUser.id,
        email: supabaseUser.email || null,
        phone: supabaseUser.phone || null,
        firstName:
          (supabaseUser.user_metadata?.first_name as string) ||
          (supabaseUser.user_metadata?.firstName as string) ||
          '',
        lastName:
          (supabaseUser.user_metadata?.last_name as string) ||
          (supabaseUser.user_metadata?.lastName as string) ||
          '',
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

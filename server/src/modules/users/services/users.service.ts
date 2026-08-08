import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  RevocationReason,
} from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UserSessionResponseDto } from '../dto/user-session-response.dto';

import { UserMapper } from '../mappers/user.mapper';
import { UserSessionMapper } from '../mappers/user-session.mapper';

import {
  USER_WITH_ROLE_INCLUDE,
  UserWithRole,
} from '../types/user.types';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userMapper: UserMapper,
    private readonly userSessionMapper: UserSessionMapper,
  ) {}

  async getMe(
    userId: string,
  ): Promise<UserResponseDto> {
    const user = await this.findUserById(userId);

    return this.userMapper.toResponse(user);
  }

  async updateProfile(
    userId: string,
    dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    await this.findUserById(userId);

    const updatedUser =
      await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
        },
        include: USER_WITH_ROLE_INCLUDE,
      });

    return this.userMapper.toResponse(
      updatedUser,
    );
  }

  async getMySessions(
    userId: string,
  ): Promise<UserSessionResponseDto[]> {
    const sessions =
      await this.prisma.userSession.findMany({
        where: {
          userId,
        },
        orderBy: {
          lastActivityAt: 'desc',
        },
      });

    return this.userSessionMapper.toResponseList(
      sessions,
    );
  }

  async revokeSession(
    userId: string,
    sessionId: string,
  ): Promise<void> {
    const session =
      await this.prisma.userSession.findFirst({
        where: {
          id: sessionId,
          userId,
        },
      });

    if (!session) {
      throw new NotFoundException(
        'Session not found.',
      );
    }

    if (session.revokedAt) {
      return;
    }

    await this.prisma.userSession.update({
      where: {
        id: session.id,
      },
      data: {
        revokedAt: new Date(),
        revocationReason:
          RevocationReason.LOGOUT,
      },
    });
  }

  async revokeAllSessions(
    userId: string,
  ): Promise<void> {
    await this.prisma.userSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revocationReason:
          RevocationReason.LOGOUT,
      },
    });
  }

  private async findUserById(
    userId: string,
  ): Promise<UserWithRole> {
    const user =
      await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
        include: USER_WITH_ROLE_INCLUDE,
      });

    if (!user) {
      throw new NotFoundException(
        'User not found.',
      );
    }

    return user;
  }
}
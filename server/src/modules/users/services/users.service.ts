import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UserMapper } from '../mappers/user.mapper';
import {
  USER_WITH_ROLE_INCLUDE,
  UserWithRole,
} from '../types/user.types';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userMapper: UserMapper,
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

    return this.userMapper.toResponse(updatedUser);
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
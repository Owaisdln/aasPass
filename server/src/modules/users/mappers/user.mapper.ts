import { Injectable } from '@nestjs/common';

import { UserResponseDto } from '../dto/user-response.dto';
import { UserWithRole } from '../types/user.types';

@Injectable()
export class UserMapper {
  toResponse(user: UserWithRole): UserResponseDto {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role.code,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt,
      phoneVerifiedAt: user.phoneVerifiedAt,
      lastSeenAt: user.lastSeenAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
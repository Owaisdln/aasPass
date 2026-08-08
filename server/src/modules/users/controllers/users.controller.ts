import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';

import { AuthenticatedUser } from '../../auth/decorators/authenticated-user.decorator';
import { SupabaseAuthGuard } from '../../auth/guards/supabase-auth.guard';

import { CurrentUser } from '../../../common/identity/current-user.model';

import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UserSessionResponseDto } from '../dto/user-session-response.dto';
import { UsersService } from '../services/users.service';

@Controller('users')
@UseGuards(SupabaseAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Get('me')
  async getMe(
    @AuthenticatedUser()
    currentUser: CurrentUser,
  ): Promise<UserResponseDto> {
    return this.usersService.getMe(
      currentUser.id,
    );
  }

  @Patch('me')
  async updateProfile(
    @AuthenticatedUser()
    currentUser: CurrentUser,

    @Body()
    dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateProfile(
      currentUser.id,
      dto,
    );
  }

  @Get('me/sessions')
  async getMySessions(
    @AuthenticatedUser()
    currentUser: CurrentUser,
  ): Promise<UserSessionResponseDto[]> {
    return this.usersService.getMySessions(
      currentUser.id,
    );
  }

  @Delete('me/sessions/:sessionId')
  async revokeSession(
    @AuthenticatedUser()
    currentUser: CurrentUser,

    @Param('sessionId')
    sessionId: string,
  ): Promise<void> {
    return this.usersService.revokeSession(
      currentUser.id,
      sessionId,
    );
  }

  @Delete('me/sessions')
  async revokeAllSessions(
    @AuthenticatedUser()
    currentUser: CurrentUser,
  ): Promise<void> {
    return this.usersService.revokeAllSessions(
      currentUser.id,
    );
  }
}
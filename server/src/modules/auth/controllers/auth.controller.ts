import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../../common/identity/current-user.model';

import { AuthenticatedUser } from '../decorators/authenticated-user.decorator';
import { SupabaseAuthGuard } from '../guards/supabase-auth.guard';

@Controller('auth')
export class AuthController {
  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  getCurrentUser(
    @AuthenticatedUser() user: CurrentUser,
  ): CurrentUser {
    return user;
  }
}
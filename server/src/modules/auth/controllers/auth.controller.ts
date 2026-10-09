import {
  Body,
  Controller,
  Get,
  Post,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../../common/identity/current-user.model';
import { DemoLoginDto } from '../dto/demo-login.dto';
import { AuthenticatedUser } from '../decorators/authenticated-user.decorator';
import { SupabaseAuthGuard } from '../guards/supabase-auth.guard';
import { AuthService } from '../services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('demo-users')
  listDemoUsers() {
    return this.authService.listDemoUsers();
  }

  @Post('demo-login')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  loginDemo(@Body() dto: DemoLoginDto) {
    return this.authService.createDemoSession(dto.email);
  }

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  getCurrentUser(@AuthenticatedUser() user: CurrentUser): CurrentUser {
    return user;
  }
}

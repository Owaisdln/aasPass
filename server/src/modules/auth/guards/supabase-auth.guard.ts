import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthService } from '../services/auth.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException(
        'Authorization header is missing.',
      );
    }

    if (!authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Invalid authorization header.',
      );
    }

    const accessToken = authorization.substring(7);

    if (!accessToken) {
      throw new UnauthorizedException(
        'Access token is missing.',
      );
    }

    request.user = await this.authService.authenticate(
      accessToken,
    );

    return true;
  }
}
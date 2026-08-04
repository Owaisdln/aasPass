import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { CurrentUser } from '../../../common/identity/current-user.model';
import { AUTHORIZATION_METADATA } from '../constants/metadata.constants';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<string[]>(
        AUTHORIZATION_METADATA.ROLES,
        [
          context.getHandler(),
          context.getClass(),
        ],
      );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const currentUser = request.user as CurrentUser;

    return requiredRoles.some((role) =>
      currentUser.hasRole(role),
    );
  }
}
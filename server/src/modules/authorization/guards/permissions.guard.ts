import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { CurrentUser } from '../../../common/identity/current-user.model';
import { AUTHORIZATION_METADATA } from '../constants/metadata.constants';

@Injectable()
export class PermissionsGuard
  implements CanActivate
{
  constructor(
    private readonly reflector: Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean {
    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(
        AUTHORIZATION_METADATA.PERMISSIONS,
        [
          context.getHandler(),
          context.getClass(),
        ],
      );

    if (
      !requiredPermissions ||
      requiredPermissions.length === 0
    ) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const currentUser = request.user as CurrentUser;

    return requiredPermissions.every((permission) =>
      currentUser.hasPermission(permission),
    );
  }
}
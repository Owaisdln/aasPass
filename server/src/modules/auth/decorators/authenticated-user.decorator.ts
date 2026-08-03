import {
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';

import { CurrentUser } from '../../../common/identity/current-user.model';

export const AuthenticatedUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CurrentUser => {
    const request = context.switchToHttp().getRequest();

    return request.user as CurrentUser;
  },
);
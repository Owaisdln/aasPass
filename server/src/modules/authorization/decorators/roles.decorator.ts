import { SetMetadata } from '@nestjs/common';

import { AUTHORIZATION_METADATA } from '../constants/metadata.constants';

export const Roles = (...roles: string[]): MethodDecorator & ClassDecorator =>
  SetMetadata(AUTHORIZATION_METADATA.ROLES, roles);
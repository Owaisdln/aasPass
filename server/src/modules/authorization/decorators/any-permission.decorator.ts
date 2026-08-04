import { SetMetadata } from '@nestjs/common';

import { AUTHORIZATION_METADATA } from '../constants/metadata.constants';

export const AnyPermission = (
  ...permissions: string[]
): MethodDecorator & ClassDecorator =>
  SetMetadata(AUTHORIZATION_METADATA.ANY_PERMISSIONS, permissions);
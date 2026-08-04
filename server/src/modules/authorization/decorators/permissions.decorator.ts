import { SetMetadata } from '@nestjs/common';

import { AUTHORIZATION_METADATA } from '../constants/metadata.constants';

export const Permissions = (
  ...permissions: string[]
): MethodDecorator & ClassDecorator =>
  SetMetadata(AUTHORIZATION_METADATA.PERMISSIONS, permissions);
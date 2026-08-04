import { SetMetadata } from '@nestjs/common';

import { AUTHORIZATION_METADATA } from '../constants/metadata.constants';

export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(AUTHORIZATION_METADATA.PUBLIC, true);
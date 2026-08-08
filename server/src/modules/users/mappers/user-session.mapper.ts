import { Injectable } from '@nestjs/common';

import { UserSession } from '@prisma/client';

import { BrowserParser } from '../../../common/parsers/browser.parser';

import { UserSessionResponseDto } from '../dto/user-session-response.dto';

@Injectable()
export class UserSessionMapper {
  toResponse(
    session: UserSession,
  ): UserSessionResponseDto {
    const parsed =
      BrowserParser.parse(
        session.userAgent,
      );

    return {
      id: session.id,
      deviceType: session.deviceType,
      browser: parsed.browser,
      os: parsed.os,
      lastActivityAt: session.lastActivityAt,
      createdAt: session.createdAt,
      revokedAt: session.revokedAt,
    };
  }

  toResponseList(
    sessions: UserSession[],
  ): UserSessionResponseDto[] {
    return sessions.map(
      (session) =>
        this.toResponse(session),
    );
  }
}
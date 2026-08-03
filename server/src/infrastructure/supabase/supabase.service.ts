import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import {
  createClient,
  SupabaseClient,
  User,
} from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly anonClient: SupabaseClient;
  private readonly adminClient: SupabaseClient;

  constructor(
    private readonly configService: ConfigService,
  ) {
    const supabaseUrl =
      this.configService.getOrThrow<string>('supabase.url');

    const anonKey =
      this.configService.getOrThrow<string>('supabase.anonKey');

    const serviceRoleKey =
      this.configService.getOrThrow<string>(
        'supabase.serviceRoleKey',
      );

    this.anonClient = createClient(
      supabaseUrl,
      anonKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    this.adminClient = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  getAnonClient(): SupabaseClient {
    return this.anonClient;
  }

  getAdminClient(): SupabaseClient {
    return this.adminClient;
  }

  async verifyAccessToken(
    accessToken: string,
  ): Promise<User> {
    const {
      data,
      error,
    } = await this.anonClient.auth.getUser(accessToken);

    if (error || !data.user) {
      throw new UnauthorizedException(
        'Invalid or expired access token.',
      );
    }

    return data.user;
  }

  async getUserById(
    userId: string,
  ): Promise<User> {
    const {
      data,
      error,
    } = await this.adminClient.auth.admin.getUserById(
      userId,
    );

    if (error || !data.user) {
      throw new UnauthorizedException(
        'User not found.',
      );
    }

    return data.user;
  }
}
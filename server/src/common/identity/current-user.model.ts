import { UserStatus } from '@prisma/client';

export class CurrentUser {
  constructor(
    public readonly id: string,
    public readonly email: string | null,
    public readonly phone: string | null,
    public readonly roleId: string,
    public readonly roleCode: string,
    public readonly permissions: string[],
    public readonly status: UserStatus,
  ) {}

  hasRole(role: string): boolean {
    return this.roleCode === role;
  }

  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }

  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  isBlocked(): boolean {
    return this.status === UserStatus.BLOCKED;
  }
}
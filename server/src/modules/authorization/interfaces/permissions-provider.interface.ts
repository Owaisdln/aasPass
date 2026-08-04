export abstract class PermissionsProvider {
  abstract getPermissionsForRole(
    roleId: string,
  ): Promise<string[]>;
}
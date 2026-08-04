# Module — Authorization

> [← Back to Server Index](./README.md)

---

## Purpose

The `AuthorizationModule` provides **declarative, metadata-driven Role-Based Access Control (RBAC)** for the aasPass server. Once the `SupabaseAuthGuard` has authenticated a request and populated `request.user` with a `CurrentUser` object, these authorization guards enforce **what** an authenticated user is permitted to do.

This module is **not** imported in `AppModule` globally. Instead, individual feature modules import it when they need RBAC enforcement on their routes.

---

## Module Structure

```
src/modules/authorization/
├── authorization.module.ts
├── constants/
│   └── metadata.constants.ts
├── decorators/
│   ├── public.decorator.ts
│   ├── roles.decorator.ts
│   ├── permissions.decorator.ts
│   └── any-permission.decorator.ts
├── guards/
│   ├── roles.guard.ts
│   ├── permissions.guard.ts
│   └── any-permission.guard.ts
├── interfaces/
│   └── permissions-provider.interface.ts
├── providers/
│   └── prisma-permissions.provider.ts
└── services/          (reserved — empty)
```

---

## Module Registration (`authorization.module.ts`)

| Property | Value |
|---|---|
| **Imports** | `PrismaModule` |
| **Providers** | `RolesGuard`, `PermissionsGuard`, `AnyPermissionGuard`, `PermissionsProvider` → `PrismaPermissionsProvider` |
| **Exports** | `RolesGuard`, `PermissionsGuard`, `AnyPermissionGuard`, `PermissionsProvider` |

`PermissionsProvider` is registered via a custom provider token so that the concrete implementation (`PrismaPermissionsProvider`) can be swapped without changing the guards.

---

## 1. Metadata Constants (`src/modules/authorization/constants/metadata.constants.ts`)

All metadata keys used by decorators and guards are centralised in a single constants object to avoid magic strings:

| Constant Key | Value | Used By |
|---|---|---|
| `AUTHORIZATION_METADATA.PUBLIC` | `'authorization:public'` | `@Public()`, (future global guard) |
| `AUTHORIZATION_METADATA.ROLES` | `'authorization:roles'` | `@Roles()`, `RolesGuard` |
| `AUTHORIZATION_METADATA.PERMISSIONS` | `'authorization:permissions'` | `@Permissions()`, `PermissionsGuard` |
| `AUTHORIZATION_METADATA.ANY_PERMISSIONS` | `'authorization:any-permissions'` | `@AnyPermission()`, `AnyPermissionGuard` |

---

## 2. Decorators

All decorators are both `MethodDecorator` and `ClassDecorator` — they can be applied to individual route handler methods or to an entire controller class.

### `@Public()`
**File:** `src/modules/authorization/decorators/public.decorator.ts`

Sets the `authorization:public` metadata key to `true`. Intended to be read by a future global guard to bypass all authorization checks on marked routes without needing to remove the guard entirely.

### `@Roles(...roles: string[])`
**File:** `src/modules/authorization/decorators/roles.decorator.ts`

Attaches an array of required role codes to the route/controller metadata. The guard reads this via `Reflector.getAllAndOverride()`.

**Example:**
```
@Roles('ADMIN', 'SUPER_ADMIN')
@Get('dashboard')
```

### `@Permissions(...permissions: string[])`
**File:** `src/modules/authorization/decorators/permissions.decorator.ts`

Attaches an array of required permission codes (AND semantics — all must be present). The guard checks that the `CurrentUser` holds **every** listed permission.

**Example:**
```
@Permissions('catalog:product:create', 'catalog:product:publish')
@Post('products')
```

### `@AnyPermission(...permissions: string[])`
**File:** `src/modules/authorization/decorators/any-permission.decorator.ts`

Attaches an array of required permission codes (OR semantics — at least one must be present). The guard checks that the `CurrentUser` holds **at least one** of the listed permissions.

**Example:**
```
@AnyPermission('order:status:update', 'order:status:admin')
@Patch('orders/:id/status')
```

---

## 3. Guards

All three guards use `Reflector.getAllAndOverride()` with `[context.getHandler(), context.getClass()]` — method-level metadata takes priority over class-level metadata. If no metadata is set, the guard returns `true` (pass-through, not fail-safe).

### `RolesGuard`
**File:** `src/modules/authorization/guards/roles.guard.ts`

| Behaviour | Detail |
|---|---|
| Reads | `AUTHORIZATION_METADATA.ROLES` from handler/class |
| No metadata set | Returns `true` — route is unrestricted by this guard |
| Check | `currentUser.hasRole(role)` — true if **any** required role matches `CurrentUser.roleCode` |
| Fail | Returns `false` → NestJS throws `403 Forbidden` |

### `PermissionsGuard`
**File:** `src/modules/authorization/guards/permissions.guard.ts`

| Behaviour | Detail |
|---|---|
| Reads | `AUTHORIZATION_METADATA.PERMISSIONS` from handler/class |
| No metadata set | Returns `true` — route is unrestricted by this guard |
| Check | `currentUser.hasPermission(permission)` for **every** required permission (AND logic) |
| Fail | Returns `false` → NestJS throws `403 Forbidden` |

### `AnyPermissionGuard`
**File:** `src/modules/authorization/guards/any-permission.guard.ts`

| Behaviour | Detail |
|---|---|
| Reads | `AUTHORIZATION_METADATA.ANY_PERMISSIONS` from handler/class |
| No metadata set | Returns `true` — route is unrestricted by this guard |
| Check | `currentUser.hasPermission(permission)` for **at least one** required permission (OR logic) |
| Fail | Returns `false` → NestJS throws `403 Forbidden` |

---

## 4. Permissions Provider

### Abstract Interface (`src/modules/authorization/interfaces/permissions-provider.interface.ts`)

`PermissionsProvider` is an **abstract class** (not a TypeScript `interface`) used as the NestJS injection token. This allows the concrete implementation to be swapped via the module's `providers` array:

```
Method: getPermissionsForRole(roleId: string): Promise<string[]>
```

### Concrete Implementation — `PrismaPermissionsProvider` (`src/modules/authorization/providers/prisma-permissions.provider.ts`)

Queries the database to return permission codes for a given role:

| Step | Action |
|---|---|
| 1 | `PrismaService.role.findUnique({ id: roleId, include: rolePermissions.permission })` |
| 2 | If role not found → returns `[]` (empty array, not an error) |
| 3 | Maps `rolePermissions[].permission.code` into a flat `string[]` |

> **Note:** `AuthService` does not currently call `PermissionsProvider` directly — it loads permissions inline via the Prisma `include` clause. `PermissionsProvider` is available for future use cases where permissions need to be fetched independently of the authentication flow (e.g. refresh scenarios or admin tooling).

---

## 5. Usage Pattern

To protect a feature module's routes with RBAC:

```
// In the feature module
@Module({
  imports: [AuthModule, AuthorizationModule],
  ...
})
export class StoreModule {}
```

```
// In the feature controller
@UseGuards(SupabaseAuthGuard, PermissionsGuard)
@Permissions('store:profile:update')
@Patch('profile')
updateProfile(...) { ... }
```

Guard evaluation order: `SupabaseAuthGuard` (authentication) → `PermissionsGuard` (authorization). Authentication must succeed before authorization is checked.

---

*End of Module — Authorization*

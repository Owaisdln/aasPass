# Module — Auth

> [← Back to Server Index](./README.md)

---

## Purpose

The `AuthModule` provides **stateless JWT authentication** for the aasPass server using Supabase as the identity provider. It does not manage user credentials — Supabase Auth handles signup, login, OTP, and token issuance. This module's responsibility is:

1. Validate incoming access tokens against Supabase.
2. Load (or auto-create) the corresponding application user record from PostgreSQL.
3. Build a `CurrentUser` domain object containing identity, role, and permissions.
4. Protect routes via the `SupabaseAuthGuard`.

---

## Module Structure

```
src/modules/auth/
├── auth.module.ts
├── controllers/
│   └── auth.controller.ts
├── decorators/
│   └── authenticated-user.decorator.ts
├── guards/
│   └── supabase-auth.guard.ts
├── interfaces/
│   └── auth-user.interface.ts
└── services/
    └── auth.service.ts
```

---

## Module Registration (`auth.module.ts`)

| Property | Value |
|---|---|
| **Imports** | `PrismaModule`, `SupabaseModule` |
| **Controllers** | `AuthController` |
| **Providers** | `AuthService`, `SupabaseAuthGuard` |
| **Exports** | `AuthService`, `SupabaseAuthGuard` |

`AuthService` and `SupabaseAuthGuard` are exported so that other feature modules can import `AuthModule` and use these providers without re-declaring them.

---

## 1. Common — `CurrentUser` Domain Model (`src/common/identity/current-user.model.ts`)

`CurrentUser` is the central identity object attached to every authenticated HTTP request via `request.user`. It is constructed by `AuthService` after token validation and user loading.

### Properties

| Property | Type | Source |
|---|---|---|
| `id` | `string` | Supabase User UUID (same as `users.id` in DB) |
| `email` | `string \| null` | From application `User` record |
| `phone` | `string \| null` | From application `User` record |
| `roleId` | `string` | From `users.role_id` |
| `roleCode` | `string` | From `roles.code` |
| `permissions` | `string[]` | Flattened `permission.code` values for the user's role |
| `status` | `UserStatus` | From `users.status` (`ACTIVE`, `INACTIVE`, `BLOCKED`, `PENDING_VERIFICATION`) |

### Methods

| Method | Signature | Returns |
|---|---|---|
| `hasRole` | `hasRole(role: string)` | `boolean` — true if `roleCode === role` |
| `hasPermission` | `hasPermission(permission: string)` | `boolean` — true if `permission` is in the `permissions` array |
| `isActive` | `isActive()` | `boolean` — true if `status === ACTIVE` |
| `isBlocked` | `isBlocked()` | `boolean` — true if `status === BLOCKED` |

---

## 2. `SupabaseAuthGuard` (`src/modules/auth/guards/supabase-auth.guard.ts`)

A NestJS `CanActivate` guard that extracts and validates the Bearer token from every protected request.

### Guard Flow

```
Incoming Request
       │
       ▼
1. Read request.headers.authorization
       │
       ├── Missing → UnauthorizedException('Authorization header is missing.')
       │
       ├── Does not start with 'Bearer ' → UnauthorizedException('Invalid authorization header.')
       │
       └── Extract token after 'Bearer '
              │
              ├── Empty token → UnauthorizedException('Access token is missing.')
              │
              └── authService.authenticate(accessToken)
                     │
                     ├── Supabase rejects token → UnauthorizedException (propagated)
                     ├── User is BLOCKED → UnauthorizedException (propagated)
                     │
                     └── Success → request.user = CurrentUser instance
                                   return true
```

### Usage

Apply to any controller method or class using NestJS's built-in `@UseGuards`:

```
@UseGuards(SupabaseAuthGuard)
@Get('me')
getCurrentUser(@AuthenticatedUser() user: CurrentUser) { ... }
```

---

## 3. `AuthService` (`src/modules/auth/services/auth.service.ts`)

The core service that converts a raw access token into a fully-populated `CurrentUser` domain object.

### `authenticate(accessToken: string): Promise<CurrentUser>`

| Step | Action | Error |
|---|---|---|
| 1 | `SupabaseService.verifyAccessToken(accessToken)` — validates token against Supabase Auth | `UnauthorizedException` if invalid/expired |
| 2 | `PrismaService.user.findUnique({ id: supabaseUser.id, include: role+permissions })` | — |
| 3 | If user not found in DB → call `syncUser(supabaseUser)` | `NotFoundException` if CUSTOMER role is missing |
| 4 | If `user.status === BLOCKED` → throw | `UnauthorizedException('Your account has been blocked.')` |
| 5 | Flatten `role.rolePermissions[].permission.code` into a string array | — |
| 6 | Construct and return `new CurrentUser(...)` | — |

### `syncUser(supabaseUser: User)` (private)

Called automatically when a Supabase-authenticated user has no matching record in the application database — typically on **first login**.

| Step | Action |
|---|---|
| 1 | Find the `CUSTOMER` role in the `roles` table |
| 2 | If not found → throw `NotFoundException('Default customer role not found.')` |
| 3 | Create a new `User` record: `id` = Supabase UUID, `email`, `phone`, `firstName: ''`, `lastName: ''`, `status: ACTIVE`, `roleId: customerRole.id` |
| 4 | Return the newly created user with role and permissions included |

> **Design note:** The auto-provisioning pattern means customers do not need a separate registration step beyond Supabase Auth signup. Their application record is created on first authenticated API call.

---

## 4. `@AuthenticatedUser()` Decorator (`src/modules/auth/decorators/authenticated-user.decorator.ts`)

A custom NestJS `createParamDecorator` that extracts the `CurrentUser` object from `request.user` and injects it directly into a route handler parameter.

### Usage

```
@Get('me')
@UseGuards(SupabaseAuthGuard)
getCurrentUser(@AuthenticatedUser() user: CurrentUser): CurrentUser {
  return user;
}
```

The guard must run before this decorator is applied — it is the guard that populates `request.user`.

---

## 5. Endpoints

### `GET /auth/me`

| Property | Value |
|---|---|
| **Controller** | `AuthController` |
| **Guard** | `SupabaseAuthGuard` |
| **Auth Required** | ✅ Yes — Bearer token in `Authorization` header |
| **Response** | `CurrentUser` object (id, email, phone, roleId, roleCode, permissions, status) |

**Request:**
```
GET /auth/me
Authorization: Bearer <supabase-access-token>
```

**Success Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "phone": null,
  "roleId": "uuid",
  "roleCode": "CUSTOMER",
  "permissions": ["catalog:product:read", "cart:item:manage"],
  "status": "ACTIVE"
}
```

**Error Responses:**

| Status | Condition |
|---|---|
| `401 Unauthorized` | Missing or malformed `Authorization` header |
| `401 Unauthorized` | Token is invalid or expired (Supabase rejection) |
| `401 Unauthorized` | User account is `BLOCKED` |

---

*End of Module — Auth*

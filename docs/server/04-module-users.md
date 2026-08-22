# Module — Users

> [← Back to Server Index](./README.md)

---

## Purpose

The `UsersModule` exposes **user self-management endpoints**. It allows an authenticated user to:

1. Retrieve their own full profile (`GET /users/me`)
2. Update their own name fields (`PATCH /users/me`)
3. List all active sessions (`GET /users/me/sessions`)
4. Revoke a specific session (`DELETE /users/me/sessions/:sessionId`)
5. Revoke all sessions (`DELETE /users/me/sessions`)

All routes in this module are protected by `SupabaseAuthGuard` — an unauthenticated request receives `401 Unauthorized` before reaching the service layer.

---

## Module Structure

```
src/modules/users/
├── users.module.ts
├── controllers/
│ └── users.controller.ts
├── dto/
│ ├── update-user.dto.ts
│ ├── user-response.dto.ts
│ └── user-session-response.dto.ts
├── mappers/
│ ├── user.mapper.ts
│ └── user-session.mapper.ts
├── services/
│ └── users.service.ts
└── types/
 └── user.types.ts
```

> **Note:** `BrowserParser` (`src/common/parsers/browser.parser.ts`) is a shared utility used by `UserSessionMapper`.

---

## Module Registration (`users.module.ts`)

| Property | Value |
|---|---|
| **Imports** | `PrismaModule`, `AuthModule` |
| **Controllers** | `UsersController` |
| **Providers** | `UsersService`, `UserMapper`, `UserSessionMapper` |
| **Exports** | *(none)* |

`AuthModule` is imported to get access to `SupabaseAuthGuard` and the `@AuthenticatedUser()` decorator used in the controller.

---

## 1. Prisma Type Utilities (`src/modules/users/types/user.types.ts`)

A shared type definition file that centralises the Prisma query shape for a user with their role loaded.

### `USER_WITH_ROLE_INCLUDE`

```typescript
export const USER_WITH_ROLE_INCLUDE = {
 role: true,
} satisfies Prisma.UserInclude;
```

A constant Prisma `include` object. Using `satisfies Prisma.UserInclude` ensures the object is validated at compile-time against the Prisma schema. This constant is passed to every Prisma query in `UsersService` so the include shape is defined in exactly one place.

### `UserWithRole`

```typescript
export type UserWithRole = Prisma.UserGetPayload<{
 include: typeof USER_WITH_ROLE_INCLUDE;
}>;
```

A derived TypeScript type representing a `User` record with the `role: Role` relation included. Used as the parameter type in `UserMapper.toResponse()` and the return type of `UsersService.findUserById()`.

---

## 2. Data Transfer Objects

### `UserResponseDto` (`src/modules/users/dto/user-response.dto.ts`)

The shape returned to the client for all user endpoints.

| Field | Type | Source |
|---|---|---|
| `id` | `string` | `user.id` (Supabase UUID) |
| `firstName` | `string` | `user.firstName` |
| `lastName` | `string \| null` | `user.lastName` |
| `email` | `string \| null` | `user.email` |
| `phone` | `string \| null` | `user.phone` |
| `role` | `string` | `user.role.code` (e.g. `"CUSTOMER"`) |
| `status` | `string` | `user.status` (e.g. `"ACTIVE"`) |
| `emailVerifiedAt` | `Date \| null` | `user.emailVerifiedAt` |
| `phoneVerifiedAt` | `Date \| null` | `user.phoneVerifiedAt` |
| `lastSeenAt` | `Date \| null` | `user.lastSeenAt` |
| `createdAt` | `Date` | `user.createdAt` |
| `updatedAt` | `Date` | `user.updatedAt` |

> **Note:** `role` is the **code string** (e.g. `"CUSTOMER"`), not the role UUID. The mapper resolves this via `user.role.code` on the included relation.

### `UpdateUserDto` (`src/modules/users/dto/update-user.dto.ts`)

The accepted request body for `PATCH /users/me`. All fields are optional.

| Field | Type | Validations |
|---|---|---|
| `firstName` | `string` (optional) | `@IsOptional`, `@IsString`, `@MinLength(2)`, `@MaxLength(100)` |
| `lastName` | `string` (optional) | `@IsOptional`, `@IsString`, `@MinLength(2)`, `@MaxLength(100)` |

### `UserSessionResponseDto` (`src/modules/users/dto/user-session-response.dto.ts`)

The shape returned for each session in the session list endpoint.

| Field | Type | Source |
|---|---|---|
| `id` | `string` | `session.id` (UUID) |
| `deviceType` | `DeviceType` | `session.deviceType` (Prisma enum: `WEB`, `MOBILE`, etc.) |
| `browser` | `string \| null` | Parsed from `session.userAgent` via `BrowserParser` |
| `os` | `string \| null` | Parsed from `session.userAgent` via `BrowserParser` |
| `lastActivityAt` | `Date` | `session.lastActivityAt` |
| `createdAt` | `Date` | `session.createdAt` |
| `revokedAt` | `Date \| null` | `session.revokedAt` — `null` means session is still active |

---

## 3. Mappers

### `UserMapper` (`src/modules/users/mappers/user.mapper.ts`)

An `@Injectable()` service class responsible for transforming a `UserWithRole` Prisma entity into a `UserResponseDto`.

#### `toResponse(user: UserWithRole): UserResponseDto`

Maps each field individually. Key transformations:

| DTO Field | Source | Reason |
|---|---|---|
| `role` | `user.role.code` | Returns the human-readable role code, not the UUID FK |
| `status` | `user.status` | Prisma `UserStatus` enum value cast to string |

No fields are computed, derived, or omitted beyond what the schema provides.

---

### `UserSessionMapper` (`src/modules/users/mappers/user-session.mapper.ts`)

An `@Injectable()` service class responsible for transforming a `UserSession` Prisma entity into a `UserSessionResponseDto`. Uses `BrowserParser` to resolve the raw `userAgent` string into structured `browser` and `os` fields.

#### `toResponse(session: UserSession): UserSessionResponseDto`

| Step | Action |
|---|---|
| 1 | `BrowserParser.parse(session.userAgent)` — parses browser name and OS from the raw user-agent string |
| 2 | Maps remaining fields directly from the Prisma entity |

#### `toResponseList(sessions: UserSession[]): UserSessionResponseDto[]`

Convenience method that calls `toResponse()` for each session in the array.

---

### `BrowserParser` (`src/common/parsers/browser.parser.ts`)

A shared static utility class (not NestJS injectable) used by `UserSessionMapper` to parse `User-Agent` strings.

- Uses the **`bowser`** npm library under the hood
- `BrowserParser.parse(userAgent: string | null): ParsedBrowser` — returns `{ browser: string | null, os: string | null }`
- Returns `{ browser: null, os: null }` when `userAgent` is `null` or empty

---

## 4. `UsersService` (`src/modules/users/services/users.service.ts`)

The service layer — handles all business logic and Prisma queries. Injected dependencies: `PrismaService`, `UserMapper`, `UserSessionMapper`.

### `getMe(userId: string): Promise<UserResponseDto>`

| Step | Action |
|---|---|
| 1 | `findUserById(userId)` — loads user from DB with role included |
| 2 | `userMapper.toResponse(user)` — maps to DTO and returns |

### `updateProfile(userId: string, dto: UpdateUserDto): Promise<UserResponseDto>`

| Step | Action |
|---|---|
| 1 | `findUserById(userId)` — validates user exists (throws `404` if not) |
| 2 | `prisma.user.update({ where: { id }, data: { firstName, lastName }, include: USER_WITH_ROLE_INCLUDE })` |
| 3 | `userMapper.toResponse(updatedUser)` — maps updated record to DTO and returns |

### `getMySessions(userId: string): Promise<UserSessionResponseDto[]>`

| Step | Action |
|---|---|
| 1 | `prisma.userSession.findMany({ where: { userId }, orderBy: { lastActivityAt: 'desc' } })` — fetches all sessions for the user, newest activity first |
| 2 | `userSessionMapper.toResponseList(sessions)` — maps to DTO list and returns |

### `revokeSession(userId: string, sessionId: string): Promise<void>`

| Step | Action | Error |
|---|---|---|
| 1 | `prisma.userSession.findFirst({ where: { id: sessionId, userId } })` — finds session scoped to the user | — |
| 2 | If `null` → throw | `NotFoundException('Session not found.')` |
| 3 | If `session.revokedAt` is already set → return early (idempotent) | — |
| 4 | `prisma.userSession.update({ data: { revokedAt: new Date(), revocationReason: RevocationReason.LOGOUT } })` | — |

> **Note:** The `userId` scope ensures a user cannot revoke another user's session. The operation is idempotent — revoking an already-revoked session is a no-op.

### `revokeAllSessions(userId: string): Promise<void>`

| Step | Action |
|---|---|
| 1 | `prisma.userSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date(), revocationReason: RevocationReason.LOGOUT } })` — bulk-revokes all non-revoked sessions |

> **Note:** Only sessions with `revokedAt: null` are affected. Already-revoked sessions are left unchanged.

### `findUserById(userId: string): Promise<UserWithRole>` (private)

Shared internal lookup used by `getMe` and `updateProfile`:

| Step | Action | Error |
|---|---|---|
| 1 | `prisma.user.findUnique({ where: { id: userId }, include: USER_WITH_ROLE_INCLUDE })` | — |
| 2 | If `null` → throw | `NotFoundException('User not found.')` |
| 3 | Return `UserWithRole` | — |

---

## 5. Endpoints

### `GET /users/me`

| Property | Value |
|---|---|
| **Controller** | `UsersController` |
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Response** | `UserResponseDto` |

Retrieves the full profile of the currently authenticated user.

**Request:**
```
GET /users/me
Authorization: Bearer <supabase-access-token>
```

**Success Response:**
```json
{
 "id": "uuid",
 "firstName": "Owais",
 "lastName": "Khan",
 "email": "owais@example.com",
 "phone": "+923001234567",
 "role": "CUSTOMER",
 "status": "ACTIVE",
 "emailVerifiedAt": "2026-08-07T10:00:00.000Z",
 "phoneVerifiedAt": null,
 "lastSeenAt": "2026-08-07T17:45:00.000Z",
 "createdAt": "2026-08-01T09:00:00.000Z",
 "updatedAt": "2026-08-07T17:45:00.000Z"
}
```

---

### `PATCH /users/me`

| Property | Value |
|---|---|
| **Controller** | `UsersController` |
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Request Body** | `UpdateUserDto` |
| **Response** | `UserResponseDto` (updated) |

Updates the name fields of the currently authenticated user. Only supplied fields are updated — omitting a field leaves it unchanged (Prisma `update` with `undefined` fields is a no-op).

**Request:**
```
PATCH /users/me
Authorization: Bearer <supabase-access-token>
Content-Type: application/json

{
 "firstName": "Owais",
 "lastName": "Khan"
}
```

**Error Responses:**

| Status | Condition |
|---|---|
| `400 Bad Request` | Validation failure on `UpdateUserDto` (e.g. `firstName` shorter than 2 chars) |
| `401 Unauthorized` | Missing, malformed, or expired Bearer token |
| `404 Not Found` | User ID from token does not exist in the application database |

---

### `GET /users/me/sessions`

| Property | Value |
|---|---|
| **Controller** | `UsersController` |
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Response** | `UserSessionResponseDto[]` |

Returns all sessions (active and revoked) for the currently authenticated user, ordered by `lastActivityAt` descending (most recent first).

**Request:**
```
GET /users/me/sessions
Authorization: Bearer <supabase-access-token>
```

**Success Response:**
```json
[
 {
 "id": "session-uuid",
 "deviceType": "WEB",
 "browser": "Chrome",
 "os": "Windows",
 "lastActivityAt": "2026-08-08T08:00:00.000Z",
 "createdAt": "2026-08-01T09:00:00.000Z",
 "revokedAt": null
 }
]
```

**Error Responses:**

| Status | Condition |
|---|---|
| `401 Unauthorized` | Missing, malformed, or expired Bearer token |

---

### `DELETE /users/me/sessions/:sessionId`

| Property | Value |
|---|---|
| **Controller** | `UsersController` |
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Path Param** | `sessionId` — UUID of the session to revoke |
| **Response** | `204 No Content` (void) |

Revokes a specific session belonging to the authenticated user. The `userId` scope ensures users cannot revoke other users' sessions. Revoking an already-revoked session is a no-op (idempotent).

**Request:**
```
DELETE /users/me/sessions/session-uuid
Authorization: Bearer <supabase-access-token>
```

**Error Responses:**

| Status | Condition |
|---|---|
| `401 Unauthorized` | Missing, malformed, or expired Bearer token |
| `404 Not Found` | Session does not exist or does not belong to the authenticated user |

---

### `DELETE /users/me/sessions`

| Property | Value |
|---|---|
| **Controller** | `UsersController` |
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Response** | `204 No Content` (void) |

Revokes **all** active sessions for the authenticated user in a single bulk update. Sessions that are already revoked are left unchanged.

**Request:**
```
DELETE /users/me/sessions
Authorization: Bearer <supabase-access-token>
```

**Error Responses:**

| Status | Condition |
|---|---|
| `401 Unauthorized` | Missing, malformed, or expired Bearer token |

---

*End of Module — Users*

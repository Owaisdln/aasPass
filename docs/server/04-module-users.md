# Module — Users

> [← Back to Server Index](./README.md)

---

## Purpose

The `UsersModule` exposes **user self-management endpoints**. It allows an authenticated user to:

1. Retrieve their own full profile (`GET /users/me`)
2. Update their own name fields (`PATCH /users/me`)

All routes in this module are protected by `SupabaseAuthGuard` — an unauthenticated request receives `401 Unauthorized` before reaching the service layer.

---

## Module Structure

```
src/modules/users/
├── users.module.ts
├── controllers/
│   └── users.controller.ts
├── dto/
│   ├── update-user.dto.ts
│   └── user-response.dto.ts
├── mappers/
│   └── user.mapper.ts
├── services/
│   └── users.service.ts
└── types/
    └── user.types.ts
```

---

## Module Registration (`users.module.ts`)

| Property | Value |
|---|---|
| **Imports** | `PrismaModule`, `AuthModule` |
| **Controllers** | `UsersController` |
| **Providers** | `UsersService`, `UserMapper` |
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

---

## 3. `UserMapper` (`src/modules/users/mappers/user.mapper.ts`)

An `@Injectable()` service class responsible for transforming a `UserWithRole` Prisma entity into a `UserResponseDto`.

### `toResponse(user: UserWithRole): UserResponseDto`

Maps each field individually. Key transformations:

| DTO Field | Source | Reason |
|---|---|---|
| `role` | `user.role.code` | Returns the human-readable role code, not the UUID FK |
| `status` | `user.status` | Prisma `UserStatus` enum value cast to string |

No fields are computed, derived, or omitted beyond what the schema provides.

---

## 4. `UsersService` (`src/modules/users/services/users.service.ts`)

The service layer — handles all business logic and Prisma queries.

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

### `findUserById(userId: string): Promise<UserWithRole>` (private)

Shared internal lookup used by both public methods:

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
| **Auth Required** | ✅ Yes |
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
| **Auth Required** | ✅ Yes |
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

*End of Module — Users*

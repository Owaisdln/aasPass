# Server Implementation Documentation

> [← Back to Index](../README.md)

---

## Purpose

This section documents the **actual, implemented** NestJS server application — what has been built, how it is structured, and how each module works. It covers only implemented code; planned-but-not-yet-built features are noted separately.

---

## Document Index

| Document | Description |
|---|---|
| [Infrastructure Layer](./01-infrastructure.md) | Configuration, Prisma, Supabase clients |
| [Module — Auth](./02-module-auth.md) | Authentication: Supabase JWT guard, user sync, `GET /auth/me` |
| [Module — Authorization](./03-module-authorization.md) | RBAC: role/permission guards and decorators |
| [Module — Users](./04-module-users.md) | User self-management: `GET /users/me`, `PATCH /users/me`, session management |
| [Module — Stores](./05-module-stores.md) | Store owner self-management: core profile, hours, delivery settings, images |

---

## Root Module Summary (`app.module.ts`)

```
AppModule
  ├── ConfigModule   (isGlobal: true, Zod-validated)
  ├── PrismaModule   (global database access)
  ├── SupabaseModule (global Supabase client)
  ├── AuthModule     (authentication — token verification, user sync)
  ├── UsersModule    (user self-management — profile, session management)
  └── StoresModule   (store owner self-management — profile, hours, delivery, images)
```

`AuthorizationModule` is implemented and available as an importable module — feature modules import it as needed when they require RBAC guards.

---

## Implemented Endpoints

| Method | Path | Guard | Description |
|---|---|---|---|
| `GET` | `/` | None (public) | Health check — returns server status |
| `GET` | `/auth/me` | `SupabaseAuthGuard` | Returns authenticated user profile and permissions |
| `GET` | `/users/me` | `SupabaseAuthGuard` | Returns full user profile with role code |
| `PATCH` | `/users/me` | `SupabaseAuthGuard` | Updates `firstName` and/or `lastName` |
| `GET` | `/users/me/sessions` | `SupabaseAuthGuard` | Lists all sessions ordered by last activity |
| `DELETE` | `/users/me/sessions/:sessionId` | `SupabaseAuthGuard` | Revokes a specific session (idempotent) |
| `DELETE` | `/users/me/sessions` | `SupabaseAuthGuard` | Revokes all active sessions (bulk) |
| `POST` | `/stores` | `SupabaseAuthGuard` | Creates a new store for the authenticated user |
| `GET` | `/stores/me` | `SupabaseAuthGuard` | Returns the authenticated user's store profile |
| `PATCH` | `/stores/me` | `SupabaseAuthGuard` | Partially updates the store profile |
| `GET` | `/stores/me/hours` | `SupabaseAuthGuard` | Returns the weekly operating schedule |
| `PUT` | `/stores/me/hours` | `SupabaseAuthGuard` | Bulk-upserts operating hours (transactional) |
| `GET` | `/stores/me/delivery-settings` | `SupabaseAuthGuard` | Returns delivery configuration |
| `PATCH` | `/stores/me/delivery-settings` | `SupabaseAuthGuard` | Creates or updates delivery settings (upsert) |
| `GET` | `/stores/me/images` | `SupabaseAuthGuard` | Lists gallery images ordered by display order |
| `POST` | `/stores/me/images` | `SupabaseAuthGuard` | Adds a new gallery image |
| `PATCH` | `/stores/me/images/:imageId/order` | `SupabaseAuthGuard` | Updates the display order of a gallery image |
| `DELETE` | `/stores/me/images/:imageId` | `SupabaseAuthGuard` | Permanently deletes a gallery image |

---

*End of Server Documentation Index*

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
| [Module — Users](./04-module-users.md) | User self-management: `GET /users/me`, `PATCH /users/me` |

---

## Root Module Summary (`app.module.ts`)

```
AppModule
  ├── ConfigModule   (isGlobal: true, Zod-validated)
  ├── PrismaModule   (global database access)
  ├── SupabaseModule (global Supabase client)
  ├── AuthModule     (authentication — token verification, user sync)
  └── UsersModule    (user self-management — GET /users/me, PATCH /users/me)
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

---

*End of Server Documentation Index*

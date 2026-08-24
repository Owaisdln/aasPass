# Server — Infrastructure Layer

> [← Back to Server Index](./README.md)

---

## 1. Application Entry Point (`src/main.ts`)

The server is bootstrapped using `NestFactory.create(AppModule)`. The port is read from the config service rather than directly from `process.env`:

```
bootstrap():
 1. NestFactory.create(AppModule)
 2. configService.get('app.port', 3000)
 3. app.listen(port)
 4. console.log(`Server running on http://localhost:${port}`)
```

No global prefix, global pipe, or versioning is applied at this stage. These will be added when feature modules introduce API routes.

---

## 2. Environment Validation (`src/config/env.validation.ts`)

All environment variables are validated at startup using **Zod**. If any required variable is missing or fails type validation, the server prints a detailed human-readable error and **hard-exits** — it will not start in an invalid state.

| Variable | Type | Required | Default | Notes |
|---|---|---|---|---|
| `NODE_ENV` | `development` \| `production` \| `test` | No | `development` | Controls environment-specific behaviour |
| `PORT` | positive integer | No | `3000` | HTTP server port |
| `DATABASE_URL` | URL string | Yes | — | PostgreSQL connection string |
| `SUPABASE_URL` | URL string | Yes | — | Supabase project URL |
| `SUPABASE_ANON_KEY` | string (min 1) | Yes | — | Public anonymous API key |
| `SUPABASE_SERVICE_ROLE_KEY` | string (min 1) | Yes | — | Admin service role key (bypasses RLS) |

---

## 3. Configuration Namespaces (`src/config/`)

Configuration is split into **named namespaces** using `@nestjs/config` `registerAs` factories. Each namespace is injected via `ConfigService.get('namespace.key')` — not via raw `process.env`.

| Namespace | Key | Env Var | Type |
|---|---|---|---|
| `app` | `app.port` | `PORT` | number |
| `app` | `app.nodeEnv` | `NODE_ENV` | string |
| `database` | `database.url` | `DATABASE_URL` | string |
| `supabase` | `supabase.url` | `SUPABASE_URL` | string |
| `supabase` | `supabase.anonKey` | `SUPABASE_ANON_KEY` | string |
| `supabase` | `supabase.serviceRoleKey` | `SUPABASE_SERVICE_ROLE_KEY` | string |

All namespaces are aggregated in `src/config/index.ts` and loaded into `ConfigModule.forRoot()` via the `load` array.

---

## 4. Root Module (`src/app.module.ts`)

```
AppModule
  ├── ConfigModule   (isGlobal: true, cache: true, expandVariables: true)
  ├── PrismaModule   (global — provides PrismaService everywhere)
  ├── SupabaseModule (global — provides SupabaseService everywhere)
  ├── AuthModule     (authentication — token verification, user sync)
  ├── UsersModule    (user self-management — profile, session management)
  ├── StoresModule   (store owner self-management — profile, hours, delivery, images)
  ├── CatalogModule  (catalog master data — categories, brands, units, master products, product images, store products)
  ├── InventoryModule (stock tracking — OCC-safe adjustments, transaction ledger)
  ├── WishlistModule (user bookmark lists — default promotion, items management)
  ├── OrdersModule   (order placement, address snapshot, OCC stock deduction, cancellation)
  └── PaymentsModule (payment creation, COD confirmation, Razorpay verification, refund initiation)
```

`ConfigModule` is marked `isGlobal: true` — `ConfigService` is injectable in any module without re-importing.

---

## 5. Health Check Controller (`src/app.controller.ts`)

A single root controller exposing one public endpoint:

| Method | Path | Auth Required | Response |
|---|---|---|---|
| `GET` | `/` | No | `{ success: true, message: 'aasPass Backend is running successfully ' }` |

This endpoint serves as a basic liveness probe. No guard, no authentication.

---

## 6. Database Access — Prisma (`src/infrastructure/prisma/`)

### Design: Prisma 7 Driver Adapter Pattern

Prisma v7 no longer accepts an empty `super()` constructor. The database connection URL is **not** defined in `schema.prisma` — it is injected at runtime via the `@prisma/adapter-pg` driver adapter.

### `PrismaService` Constructor Flow

```
1. new Pool({ connectionString: process.env.DATABASE_URL })
2. new PrismaPg(pool)
3. super({ adapter }) — Prisma 7 constructor
4. OnModuleInit → $connect()
5. OnModuleDestroy → $disconnect()
 → pool.end() — prevents connection leaks
```

### `PrismaModule` Registration

Registered as a **global module** — `PrismaService` is available in any module that imports `PrismaModule` without re-declaring it in each module's `imports`.

---

## 7. Supabase Clients (`src/infrastructure/supabase/`)

### Two-Client Architecture

`SupabaseService` initialises two independent `SupabaseClient` instances at module startup:

| Client | Key Used | Purpose |
|---|---|---|
| `anonClient` | `SUPABASE_ANON_KEY` | User-context operations; JWT token verification via `getUser()` |
| `adminClient` | `SUPABASE_SERVICE_ROLE_KEY` | Privileged operations; bypasses RLS; user management |

Both clients are configured with `autoRefreshToken: false` and `persistSession: false` — the server is stateless; it does not hold Supabase session state.

### Service Methods

| Method | Client Used | Behaviour |
|---|---|---|
| `getAnonClient()` | — | Returns the raw `anonClient` instance |
| `getAdminClient()` | — | Returns the raw `adminClient` instance |
| `verifyAccessToken(accessToken)` | `anonClient` | Calls `auth.getUser(token)`. Throws `UnauthorizedException` if token is invalid or expired |
| `getUserById(userId)` | `adminClient` | Calls `auth.admin.getUserById(userId)`. Throws `UnauthorizedException` if user is not found |

### `SupabaseModule` Registration

Registered as a **global module** — `SupabaseService` is injectable in any module that imports `SupabaseModule`.

---

*End of Infrastructure Layer*

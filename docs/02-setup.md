# 02 — Local Setup

> [← Back to Index](../README.md)

---

## Prerequisites

Make sure the following are installed on your machine:

| Tool | Version | Purpose |
|---|---|---|
| Node.js | LTS (20+) | JavaScript runtime |
| npm | Bundled with Node | Package manager |
| PostgreSQL | 14+ | Primary database |
| Redis | 6+ | Cache & job queue backend |
| Git | Any | Version control |

---

## 1. Clone the Repository

```bash
git clone <repo-url>
cd aasPass
```

---

## 2. Install Dependencies

```bash
cd server
npm install
```

---

## 3. Configure Environment Variables

Create a `.env` file inside the `server/` directory:

```env
# App
NODE_ENV=development
PORT=3000

# Database — PostgreSQL connection string (required)
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/aaspass?schema=public"

# Supabase (required — use placeholder values for local dev)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> All six variables are **validated at startup** via Zod. Missing or malformed values will print a detailed error and abort the process.
>
> **Never commit your `.env` file.** It is already listed in `.gitignore`.

---

## 4. Set Up the Database

Make sure PostgreSQL is running, then run:

```bash
cd server

# 1. Generate the Prisma client (always run after schema changes)
npx prisma generate

# 2. Apply existing migrations
npx prisma migrate dev
```

> **Prisma 7 Note:** This project uses the **driver adapter** pattern. The `DATABASE_URL` is **not** in `schema.prisma` — it is injected at runtime by `PrismaService` via `@prisma/adapter-pg`. The `prisma.config.ts` file at the server root provides it to Prisma CLI tools.

---

## 5. Run the Development Server

```bash
cd server
npm run start:dev
```

The server will start with **hot-reload** on `http://localhost:3000`.

---

## 6. View API Documentation

Once the server is running, open:

```
http://localhost:3000/api
```

Swagger UI will display all available endpoints.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run start:dev` | Development server with hot reload |
| `npm run start:debug` | Debug mode with Node inspector |
| `npm run start:prod` | Production mode (requires build first) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run lint` | Lint and auto-fix with ESLint |
| `npm run format` | Format with Prettier |
| `npm run test` | Run unit tests |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run test:cov` | Unit tests with coverage report |
| `npm run test:e2e` | End-to-end tests |

---

## Prisma Commands

| Command | Description |
|---|---|
| `npx prisma migrate dev` | Create & apply a new migration |
| `npx prisma migrate deploy` | Apply migrations in production |
| `npx prisma db push` | Push schema without migration file |
| `npx prisma generate` | Regenerate Prisma client |
| `npx prisma studio` | Visual database browser at `localhost:5555` |
| `npx prisma migrate reset` | Reset DB and re-apply all migrations |

---

## Project Directory (Server)

```
server/
├── src/
│ ├── main.ts ← App entry point — binds port via ConfigService
│ ├── app.module.ts ← Root NestJS module (ConfigModule, PrismaModule, SupabaseModule, AuthModule, UsersModule, StoresModule, CatalogModule, InventoryModule)
│ ├── app.controller.ts ← Health check: GET /
│ ├── config/ ← Config namespaces + Zod env validation
│ │ ├── index.ts ← Aggregates all config loaders
│ │ ├── app.config.ts ← app.port, app.nodeEnv
│ │ ├── database.config.ts ← database.url
│ │ ├── supabase.config.ts ← supabase.url, keys
│ │ └── env.validation.ts ← Zod schema — validates all env vars at boot
│ ├── infrastructure/ ← Database and external service clients
│ │ ├── prisma/
│ │ │ ├── prisma.service.ts ← PrismaClient with pg Pool adapter (Prisma 7)
│ │ │ └── prisma.module.ts ← Global @Module exporting PrismaService
│ │ └── supabase/
│ │ ├── supabase.service.ts ← anonClient + adminClient + verifyAccessToken
│ │ └── supabase.module.ts ← Global @Module exporting SupabaseService
│ ├── common/ ← Shared utilities and domain models
│ │ ├── identity/
│ │ │ └── current-user.model.ts ← CurrentUser domain model (RBAC, status)
│ │ └── parsers/
│ │ └── browser.parser.ts ← User-agent parser (bowser)
│ ├── shared/ ← (reserved) Shared DTOs, utilities
│ └── modules/ ← Feature modules
│ ├── auth/ ← Authentication (SupabaseAuthGuard, AuthService)
│ ├── authorization/ ← RBAC guards and decorators
│ ├── users/ ← User self-management (profile, sessions)
│ ├── stores/ ← Store owner management (profile, hours, delivery, images)
│ ├── catalog/ ← Product catalog (categories, brands, units, master products, product images, store products)
│ ├── inventory/ ← Stock management (OCC adjustments, transaction ledger)
│ └── wishlist/ ← Wishlists (pending AppModule registration)
├── prisma/
│ ├── schema.prisma ← Merged schema (no url in datasource — Prisma 7)
│ ├── prisma.config.ts ← Prisma 7 config (CLI datasource URL + paths)
│ ├── modules/ ← Per-module split schema files (modules 1–6)
│ ├── migrations/ ← Migration history
│ └── ERD.svg ← Auto-generated ER diagram
├── .env ← Environment variables (not committed)
├── nest-cli.json
├── package.json
└── tsconfig.json
```

# aasPass — Server

Backend API server for the **aasPass** project, built with **NestJS**, **Prisma 7**, and **PostgreSQL**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [NestJS](https://nestjs.com/) v11 |
| Language | TypeScript v5 |
| ORM | [Prisma](https://www.prisma.io/) v7 |
| Database | PostgreSQL |
| DB Adapter | `@prisma/adapter-pg` + `pg` (Prisma 7 driver adapter pattern) |
| Config | `@nestjs/config` with Zod validation |
| Auth (planned) | `@nestjs/jwt`, `passport`, `passport-jwt` |
| API Docs (planned) | `@nestjs/swagger` |
| Queue (planned) | `@nestjs/bullmq` + BullMQ + Redis |
| WebSockets (planned) | `@nestjs/websockets`, `socket.io` |

---

## Prerequisites

- **Node.js** v20+
- **PostgreSQL** running locally (or a remote connection string)
- **npm** v10+

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example below and save it as `.env` in the `server/` root:

```env
NODE_ENV=development
PORT=3000

DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/aaspass?schema=public"

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> All variables are **required** and validated at startup via Zod. The server will refuse to boot if any are missing or malformed.

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Run database migrations

```bash
npx prisma migrate dev
```

### 5. Start the server

```bash
# Development (watch mode)
npm run start:dev

# Standard start
npm run start

# Production
npm run start:prod
```

The server will start on `http://localhost:3000` (or the port set in `.env`).

---

## Project Structure

```
server/
├── prisma/
│   ├── schema.prisma          # Database schema (Prisma 7, no `url` in datasource)
│   ├── migrations/            # Migration history
│   └── ERD.svg                # Auto-generated entity relationship diagram
├── prisma.config.ts           # Prisma 7 config — datasource URL & migration path
├── src/
│   ├── app.module.ts          # Root NestJS module
│   ├── main.ts                # Application entry point
│   ├── config/                # Configuration layer
│   │   ├── index.ts           # Aggregates all config namespaces
│   │   ├── app.config.ts      # App namespace: port, nodeEnv
│   │   ├── database.config.ts # Database namespace: DATABASE_URL
│   │   ├── supabase.config.ts # Supabase namespace: url, keys
│   │   └── env.validation.ts  # Zod schema — validates all env vars at boot
│   ├── prisma/                # Database access layer
│   │   ├── prisma.service.ts  # PrismaClient wrapper using adapter-pg
│   │   └── prisma.module.ts   # Global NestJS module exporting PrismaService
│   ├── modules/               # Feature modules (to be added)
│   ├── common/                # Shared guards, pipes, filters (to be added)
│   ├── infrastructure/        # External integrations (to be added)
│   └── shared/                # Shared DTOs, utilities (to be added)
└── .env                       # Local environment variables (git-ignored)
```

---

## Configuration System

Configuration uses `@nestjs/config` with **named namespaces** and **Zod validation**.

### Namespaces

| Namespace | Key | Values |
|---|---|---|
| `app` | `app.port` | Server port (default: `3000`) |
| `app` | `app.nodeEnv` | `development` \| `production` \| `test` |
| `database` | `database.url` | PostgreSQL connection string |
| `supabase` | `supabase.url` | Supabase project URL |
| `supabase` | `supabase.anonKey` | Supabase anon key |
| `supabase` | `supabase.serviceRoleKey` | Supabase service role key |

### Validation

All environment variables are validated at startup using Zod (`src/config/env.validation.ts`). If validation fails, the error is printed in a human-readable format and the process exits.

```
Invalid environment variables
✗ DATABASE_URL: Invalid URL
```

---

## Database & Prisma

### Prisma 7 Architecture

This project uses **Prisma 7** with the **driver adapter** pattern — the connection URL is **not** defined in `schema.prisma`. Instead it is injected at runtime via `@prisma/adapter-pg`.

**`prisma.config.ts`** (used by Prisma CLI tools):
```ts
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env.DATABASE_URL },
});
```

**`PrismaService`** (used at runtime by NestJS):
```ts
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
super({ adapter });
```

### Common Prisma Commands

```bash
# Generate client after schema changes
npx prisma generate

# Create and apply a new migration
npx prisma migrate dev --name <migration-name>

# Apply migrations in production
npx prisma migrate deploy

# Open Prisma Studio (database GUI)
npx prisma studio

# Reset the database (dev only — destructive)
npx prisma migrate reset
```

---

## Running Tests

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov

# End-to-end tests
npm run test:e2e
```

---

## Scripts Reference

| Script | Description |
|---|---|
| `npm run start` | Start the server |
| `npm run start:dev` | Start with file watching (development) |
| `npm run start:debug` | Start with debugger attached |
| `npm run start:prod` | Run compiled production build |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run lint` | Lint and auto-fix source files |
| `npm run format` | Format with Prettier |

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | No (default: `development`) | Runtime environment |
| `PORT` | No (default: `3000`) | HTTP server port |
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string |
| `SUPABASE_URL` | ✅ Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | ✅ Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | Supabase service role key |

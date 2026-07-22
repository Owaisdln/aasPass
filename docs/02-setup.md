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

```bash
cp server/.env.example server/.env   # (if .env.example exists)
# OR create manually:
```

```env
# Database
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/aaspass?schema=public"

# App
PORT=3000

# JWT (add when implemented)
# JWT_ACCESS_SECRET=your_access_secret
# JWT_REFRESH_SECRET=your_refresh_secret
# JWT_ACCESS_EXPIRES_IN=15m
# JWT_REFRESH_EXPIRES_IN=7d

# Redis (add when implemented)
# REDIS_HOST=localhost
# REDIS_PORT=6379
```

> ⚠️ **Never commit your `.env` file.** It is already listed in `.gitignore`.

---

## 4. Set Up the Database

Make sure PostgreSQL is running, then run Prisma migrations:

```bash
cd server

# Apply existing migrations
npx prisma migrate dev

# Or push schema directly (no migration file)
npx prisma db push

# Regenerate Prisma client after schema changes
npx prisma generate
```

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
| `npx prisma migrate reset` | Reset DB and re-apply all migrations ⚠️ |

---

## Project Directory (Server)

```
server/
├── src/
│   ├── main.ts           ← App entry point (port binding)
│   ├── app.module.ts     ← Root NestJS module
│   ├── common/           ← Guards, decorators, pipes, filters
│   ├── config/           ← ConfigService, env validation
│   ├── infrastructure/   ← Redis, queues setup
│   ├── modules/          ← Feature modules (auth, store, etc.)
│   ├── prisma/           ← PrismaService wrapper
│   └── shared/           ← Shared DTOs, interfaces
├── prisma/
│   ├── schema.prisma     ← Main schema (IAM + datasource)
│   └── modules/          ← Per-module schema files
├── .env                  ← Environment variables (not committed)
├── nest-cli.json
├── package.json
└── tsconfig.json
```

# aasPass

> Hyperlocal commerce platform — connecting customers with nearby stores for fast grocery and retail delivery.

---

## Repository Structure

```
aasPass/
├── server/         # NestJS backend API
├── client/         # Frontend (not yet scaffolded)
└── docs/           # Project documentation
```

---

## Documentation

All project documentation lives in [`docs/`](./docs/README.md).

| Document | Version | Description |
|---|---|---|
| [Low Level Design (LLD)](./docs/LLD/lld-v0.1.md) | v0.1 Draft | Detailed implementation design for all 6 modules |
| [Data Dictionary](./docs/data-dictionary/data-dictionary-v0.1.md) | v0.1 Draft | All 33 tables, 26 enums, indexes and constraints |
| [Architecture Overview](./docs/03-architecture.md) | — | System architecture, request lifecycle |
| [Setup Guide](./docs/02-setup.md) | — | Environment setup and getting started |
| [Changelog](./docs/changelog.md) | — | All notable changes by date |

---

## Quick Start

See the [Server README](./server/README.md) for setup instructions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | NestJS v11 + TypeScript |
| ORM | Prisma v7 (driver adapter pattern) |
| Database | PostgreSQL (via Supabase) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |

---

## Module Overview

| # | Module | Tables | Status |
|---|---|---|---|
| 1 | Identity & Access Management (IAM) | 7 | ✅ Schema complete |
| 2 | Store Management | 4 | ✅ Schema complete |
| 3 | Catalog & Inventory | 8 | ✅ Schema complete |
| 4 | Cart & Wishlist | 4 | ✅ Schema complete |
| 5 | Order Management | 5 | ✅ Schema complete |
| 6 | Payment & Financial | 5 | ✅ Schema complete |

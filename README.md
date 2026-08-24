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

## Quick Start

See the [Server README](./server/README.md) for environment setup, Prisma commands, and how to run the dev server.

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

| # | Module | Status |
|---|---|---|
| 1 | Identity & Access Management (IAM) | Auth, RBAC, Users, Session management implemented |
| 2 | Store Management | Store profile, hours, delivery settings, images implemented |
| 3 | Catalog & Inventory | Categories, brands, units, master products, product images, store products, inventory implemented |
| 4 | Cart & Wishlist | Wishlist implemented; Cart API pending |
| 5 | Order Management | Order placement, address snapshot, OCC stock deduction, cancellation implemented |
| 6 | Payment & Financial | Payment creation, COD confirmation, Razorpay verification, refund initiation implemented |

---

## Documentation

All project documentation lives in [`docs/`](./docs/README.md).

| Document | Description |
|---|---|
| [Docs Index](./docs/README.md) | Full index of all documentation |
| [Server Implementation](./docs/server/README.md) | All implemented modules and endpoints |
| [Architecture Overview](./docs/03-architecture.md) | System architecture, request lifecycle, naming conventions |
| [Setup Guide](./docs/02-setup.md) | Environment setup and getting started |
| [Low Level Design (LLD)](./docs/LLD/lld-v0.1.md) | v0.1 Draft — detailed implementation design |
| [Data Dictionary](./docs/data-dictionary/data-dictionary-v0.1.md) | v0.1 Draft — all 33 tables, 26 enums, indexes |
| [Changelog](./docs/changelog.md) | All notable changes by date |

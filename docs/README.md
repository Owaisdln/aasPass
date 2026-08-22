# aasPass Documentation

> **Platform:** aasPass — Hyperlocal commerce platform  
> **Last Updated:** 2026-08-22

---

## Document Index

### Server Implementation

| Document | Version | Status | Description |
|---|---|---|---|
| [Server Index](./server/README.md) | — | ✅ Active | Root module summary and implemented endpoint table |
| [Infrastructure Layer](./server/01-infrastructure.md) | — | ✅ Active | Bootstrap, config, Prisma, Supabase, health check |
| [Module — Auth](./server/02-module-auth.md) | — | ✅ Active | SupabaseAuthGuard, AuthService, CurrentUser, `GET /auth/me` |
| [Module — Authorization](./server/03-module-authorization.md) | — | ✅ Active | RBAC guards, decorators, permissions provider |
| [Module — Users](./server/04-module-users.md) | — | ✅ Active | User self-management: `GET /users/me`, `PATCH /users/me`, sessions |
| [Module — Stores](./server/05-module-stores.md) | — | ✅ Active | Store owner self-management: profile, hours, delivery, images |
| [Module — Catalog](./server/06-module-catalog.md) | — | ✅ Active | Catalog master data: categories, brands, units, master products, product images, store products |
| [Module — Inventory](./server/07-module-inventory.md) | — | ✅ Active | Stock management: OCC-safe adjustments, transaction ledger |
| [Module — Wishlist](./server/08-module-wishlist.md) | — | ✅ Active | User wishlists: named bookmark lists with items, default promotion |

### Architecture & Design

| Document | Version | Status | Description |
|---|---|---|---|
| [High Level Design (HLD)](./HLD/) | *(planned)* | ⬜ Not Started | Module-level scope, goals, and system overview |
| [Low Level Design (LLD)](./LLD/lld-v0.1.md) | v0.1 | 🟡 Draft | Detailed implementation — infrastructure, schema design decisions, data flows |
| [Architecture Overview](./03-architecture.md) | — | ✅ Active | System diagram, request lifecycle, naming conventions |

### Database

| Document | Version | Status | Description |
|---|---|---|---|
| [Data Dictionary](./data-dictionary/data-dictionary-v0.1.md) | v0.1 | 🟡 Draft | All tables, columns, types, constraints, and indexes |

### Guides & Setup

| Document | Description |
|---|---|
| [Overview](./01-overview.md) | Project overview |
| [Setup Guide](./02-setup.md) | Environment setup and getting started |
| [Security Guide](./guides/security.md) | Security practices |

### Release & Change Management

| Document | Description |
|---|---|
| [Changelog](./changelog.md) | All notable changes by date |
| [Release Notes](./release-notes/) | *(planned)* Deployment-ready release documentation |

---

## Version Conventions

| Version Range | Stage | Meaning |
|---|---|---|
| `v0.1`, `v0.2`, … | Draft | Work in progress, under review |
| `v1.0`, `v1.1`, … | Released/Approved | Reviewed and approved version |

---

## Document Status Legend

| Icon | Status |
|---|---|
| ⬜ | Not Started |
| 🟡 | Draft |
| 🔵 | Under Review |
| ✅ | Approved / Active |

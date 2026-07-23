# aasPass — Documentation Index

> **Multi-Vendor E-Commerce / Marketplace Platform**  
> **Status:** 🟡 In Development  
> **Last Updated:** July 23, 2026

---

## 📚 Documentation

### 🏠 General
| Document | Description |
|---|---|
| [01 — Project Overview](./01-overview.md) | Goals, tech stack, key design decisions |
| [02 — Local Setup](./02-setup.md) | Prerequisites, installation, running locally |
| [03 — Architecture](./03-architecture.md) | System diagrams, request lifecycle, infrastructure |

### 🗄️ Database Schemas
| Module | Status | Document |
|---|---|---|
| Module 1 — Identity & Access Management | ✅ Schema Complete (9 models) | [database/module1-iam.md](./database/module1-iam.md) |
| Module 2 — Store Management | ✅ Schema Complete (4 models) | [database/module2-store.md](./database/module2-store.md) |
| Module 3 — Catalog & Inventory | ✅ Schema Complete (8 models) | [database/module3-catalog.md](./database/module3-catalog.md) |
| Module 4 — Cart & Wishlist | ✅ Schema Complete (4 models) | [database/module4-cart.md](./database/module4-cart.md) |
| Module 5 — Order Management | ✅ Schema Complete (6 models) | [database/module5-order.md](./database/module5-order.md) |
| Module 6 — Payment & Financial | ✅ Schema Complete (5 models) | [database/module6-payment.md](./database/module6-payment.md) |

### 🔒 Guides
| Document | Description |
|---|---|
| [Security](./guides/security.md) | JWT strategy, RBAC, password hashing, token revocation |

### 📋 Changelog
| Document | Description |
|---|---|
| [Changelog](./changelog.md) | What was built and when |

---

> 📝 **New sections (API docs, more database modules, deployment guide, contributing guide) will be added here as each part of the project is built and completed.**

---

## 🚀 Quick Start

```bash
cd server
npm install
npm run start:dev
```

> See [02 — Local Setup](./02-setup.md) for full instructions.

---

## 📁 Project Structure (Top Level)

```
aasPass/
├── docs/          ← You are here
├── client/        ← Frontend (not started)
└── server/        ← NestJS backend
    ├── prisma.config.ts  ← Prisma 7 CLI config
    └── src/
        ├── config/       ← Env config + Zod validation
        └── prisma/       ← PrismaService (adapter-pg)
```

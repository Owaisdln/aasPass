# aasPass Documentation

> **Platform:** aasPass — Hyperlocal commerce platform
> **Last Updated:** 2026-10-23

---

## Document Index

### Server Implementation

| Document | Version | Status | Description |
|---|---|---|---|
| [Server Index](./server/README.md) | — | Active | Root module summary and implemented endpoint table |
| [Infrastructure Layer](./server/01-infrastructure.md) | — | Active | Bootstrap, config, Prisma, Supabase, health check |
| [Module — Auth](./server/02-module-auth.md) | — | Active | SupabaseAuthGuard, AuthService, CurrentUser, `GET /auth/me` |
| [Module — Authorization](./server/03-module-authorization.md) | — | Active | RBAC guards, decorators, permissions provider |
| [Module — Users](./server/04-module-users.md) | — | Active | User self-management: `GET /users/me`, `PATCH /users/me`, sessions |
| [Module — Stores](./server/05-module-stores.md) | — | Active | Store owner self-management: profile, hours, delivery, images |
| [Module — Catalog](./server/06-module-catalog.md) | — | Active | Catalog master data: categories, brands, units, master products, product images, store products |
| [Module — Inventory](./server/07-module-inventory.md) | — | Active | Stock management: OCC-safe adjustments, transaction ledger |
| [Module — Wishlist](./server/08-module-wishlist.md) | — | Active | User wishlists: named bookmark lists with items, default promotion |
| [Module — Orders](./server/09-module-orders.md) | — | Active | Order placement & management: checkout from cart, address snapshot, stock deduction, cancellation |
| [Module — Payments](./server/10-module-payments.md) | — | Active | Payment creation, COD confirmation, Razorpay verification flow, refund initiation |

### Mobile App

| Document | Version | Status | Description |
|---|---|---|---|
| [Mobile Index](./mobile/README.md) | — | Active | App overview, technology stack, and document index |
| [Bootstrap & Layout](./mobile/01-bootstrap-layout.md) | — | Active | Root layout, splash screen, providers, startup sequence |
| [Navigation & Routing](./mobile/02-navigation-routing.md) | — | Active | Expo Router file-system routing, tab layout, screen hierarchy |
| [State Management](./mobile/03-state-management.md) | — | Active | Zustand store slices, sync architecture, add-to-cart rules |
| [Domain Models](./mobile/04-domain-models.md) | — | Active | Core TypeScript types and pure helpers (model.ts) |
| [API Layer](./mobile/05-api-layer.md) | — | Active | HTTP client, Supabase auth, all domain API modules |
| [Components](./mobile/06-components.md) | — | Active | Shared UI component reference |
| [Screens](./mobile/07-screens.md) | — | Active | Screen-by-screen feature reference (13 screens) |

### Vendor App

| Document | Version | Status | Description |
|---|---|---|---|
| [Vendor Index](./vendor/README.md) | — | Active | Vendor portal overview, dual-target architecture, scripts |
| [Bootstrap & Layout](./vendor/01-bootstrap-layout.md) | — | Active | Root layout, providers, theme palette, native UI primitives |
| [Navigation & Routing](./vendor/02-navigation-routing.md) | — | Active | Dual-engine routing: Expo Router and TanStack Start route trees |
| [Session & State Management](./vendor/03-session-state.md) | — | Active | Zustand `useSession`, persistence, live vs demo modes |
| [Domain Models & Business Rules](./vendor/04-domain-models-rules.md) | — | Active | Core TypeScript types, pricing rules, stock deltas, order states |
| [API Layer & Integration](./vendor/05-api-layer.md) | — | Active | HTTP client, Supabase auth, REST endpoints, real-time sync |
| [Screens & Feature Reference](./vendor/06-screens-features.md) | — | Active | Screen walkthrough: connect, profile, hours, delivery, stock, orders |

### MCP Server

| Document | Version | Status | Description |
|---|---|---|---|
| [MCP Server Index](./mcp-server/README.md) | — | Active | Service overview, architecture tree, running endpoints |
| [Entry Point & Bootstrap](./mcp-server/01-entry-bootstrap.md) | — | Active | `index.ts`, startup sequence, service wiring |
| [Core — BaseTool & ServiceContainer](./mcp-server/02-core.md) | — | Active | Tool base class, service container, tool registry |
| [Agent & AI Layer](./mcp-server/03-agent-ai.md) | — | Active | Agent loop, AIManager, multi-provider fallback, tool orchestration |
| [Context Engine](./mcp-server/04-context-engine.md) | — | Active | TaskSnapshot, ContextStore, ContextIndex, ContextBuilder |
| [Conversation & Memory](./mcp-server/05-conversation-memory.md) | — | Active | ConversationService, MemoryService, short/long-term memory |
| [Session & Workspace](./mcp-server/06-session-workspace.md) | — | Active | SessionManager, WorkspaceManager, WorkspaceScanner |
| [MCP Protocol Layer](./mcp-server/07-mcp-protocol.md) | — | Active | MCPManager, MCPClient, MCPConnection, transports |
| [API Server & WebSocket Gateway](./mcp-server/08-api-gateway.md) | — | Active | ApiServer, Controllers, Routes, WebSocketGateway, EventBus |
| [Tool Reference](./mcp-server/09-tools.md) | — | Active | All 53 registered tools grouped by category |

### Architecture & Design

| Document | Version | Status | Description |
|---|---|---|---|
| [High Level Design (HLD)](./HLD/) | *(planned)* | Not Started | Module-level scope, goals, and system overview |
| [Low Level Design (LLD)](./LLD/lld-v0.1.md) | v0.1 | Draft | Detailed implementation — infrastructure, schema design decisions, data flows |
| [Architecture Overview](./03-architecture.md) | — | Active | System diagram, request lifecycle, naming conventions |

### Database

| Document | Version | Status | Description |
|---|---|---|---|
| [Data Dictionary](./data-dictionary/data-dictionary-v0.1.md) | v0.1 | Draft | All tables, columns, types, constraints, and indexes |

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
| | Not Started |
| | Draft |
| | Under Review |
| | Approved / Active |

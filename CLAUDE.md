# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A scalable **e-commerce platform** built with microservices architecture. Each business domain is an independent NestJS microservice communicating via TCP through an API Gateway. Services are containerized with Docker and designed for independent development, deployment, and scaling.

## Service Responsibilities

### api-gateway (`apps/api-gateway`, HTTP :3000)
Entry point for all HTTP client requests. Routes to appropriate microservices. Handles cross-cutting concerns: request validation, auth token verification (JWT), rate limiting, and response shaping. Does NOT contain business logic — delegates everything downstream.

### users-service (`apps/users-service`, TCP :4001)
User registration, login, JWT issuance, and profile management.
- **Message patterns:** `user.register`, `user.login`, `user.getProfile`, `user.updateProfile`, `user.deleteAccount`
- **Data:** Users table with hashed passwords (bcrypt), roles (`customer`, `admin`)
- **Owns:** Authentication logic, password hashing, JWT signing

### products-service (`apps/products-service`, TCP :4002)
Product catalog management: listings, categories, search, and inventory tracking.
- **Message patterns:** `product.create`, `product.findAll`, `product.findOne`, `product.update`, `product.delete`, `product.search`, `product.updateStock`
- **Data:** Products table (name, description, price, stock, category, images), Categories table
- **Owns:** Catalog state, stock levels (decremented by Order Service on purchase)

### cart-service (`apps/cart-service`, TCP :4003) — planned
Per-user shopping cart backed by Redis for fast read/write.
- **Message patterns:** `cart.get`, `cart.addItem`, `cart.removeItem`, `cart.updateQuantity`, `cart.clear`
- **Data:** Redis hash per user — `cart:{userId}` → `{ productId: { qty, price, name } }`
- **Owns:** Cart state only; reads product prices from products-service on add

### order-service (`apps/order-service`, TCP :4004) — planned
Places orders from cart contents, tracks order status, manages order history.
- **Message patterns:** `order.create`, `order.findByUser`, `order.findOne`, `order.updateStatus`, `order.cancel`
- **Data:** Orders table (userId, items snapshot, total, status), OrderItems table
- **Flow:** create → emit `order.created` → payment-service charges → emit `payment.succeeded` → decrement stock in products-service → notify via notification-service
- **Statuses:** `pending` → `paid` → `processing` → `shipped` → `delivered` | `cancelled` | `refunded`

### payment-service (`apps/payment-service`, TCP :4005) — planned
Stripe integration for payment processing. Handles charge, refund, and webhook events.
- **Message patterns:** `payment.charge`, `payment.refund`, `payment.getHistory`
- **External:** Stripe API (Payment Intents)
- **Owns:** Payment records, Stripe customer IDs; never stores raw card data

### notification-service (`apps/notification-service`, TCP :4006) — planned
Event-driven service that sends emails (SendGrid) and SMS (Twilio) in response to domain events emitted by other services.
- **Listens to events (emit, not send):** `order.created`, `payment.succeeded`, `payment.failed`, `order.shipped`
- **Owns:** Notification templates and delivery logs; no business logic

## Commands

**All services (from root):**
```bash
pnpm run dev          # Start all services in watch mode
pnpm run build        # Build all services
pnpm run lint         # Lint all packages
pnpm run check-types  # TypeScript type checking across all packages
pnpm run format       # Prettier format all TS/TSX/MD files
```

**Single service (from root):**
```bash
turbo run start:dev --filter=api-gateway
turbo run start:dev --filter=products-service
turbo run start:dev --filter=users-service
```

**Tests (run from within a service directory or use filter):**
```bash
pnpm test                  # Run tests once
pnpm run test:watch        # Watch mode
pnpm run test:cov          # With coverage
pnpm run test:e2e          # E2E tests (uses ./test/jest-e2e.json)
turbo run test --filter=api-gateway  # Single service from root
```

## Architecture

This is a **Turborepo monorepo** using pnpm workspaces with a NestJS microservices architecture.

### Services and Ports

```
HTTP Client
    ↓
api-gateway        (HTTP :3000)  — entry point for all client requests
    ├→ users-service             (TCP :4001)  ✅ active
    ├→ products-service          (TCP :4002)  ✅ active
    ├→ cart-service              (TCP :4003)  🔲 planned
    ├→ order-service             (TCP :4004)  🔲 planned
    ├→ payment-service           (TCP :4005)  🔲 planned
    └→ notification-service      (TCP :4006)  🔲 planned (event-driven, no HTTP routes)
```

- **api-gateway** (`apps/api-gateway`): Express-based HTTP server. Registers microservice clients via `ClientsModule`. Service identifiers are in `src/constants.ts` (`MICROSERVICES.*`).
- **users-service** (`apps/users-service`): Auth and user profiles. TCP port 4001.
- **products-service** (`apps/products-service`): Product catalog and inventory. TCP port 4002.

### Shared Packages

- `packages/ui`: React component library (React 19)
- `packages/eslint-config`: Shared ESLint configs (`./base`, `./next-js`, `./react-internal`)
- `packages/typescript-config`: Shared TypeScript base configs

### Inter-service Communication

The gateway communicates with microservices using NestJS `ClientProxy` (TCP transport). Inject the client using the service identifier constant from `apps/api-gateway/src/constants.ts` and use `.send()` / `.emit()` with message patterns that match `@MessagePattern()` decorators in the target services.

### Tech Stack

- **Framework:** NestJS v11 on all services
- **Transport:** TCP (NestJS microservices)
- **Language:** TypeScript 5.7, targeting ES2023
- **Build:** `nest build` → output to `dist/`
- **Test:** Jest + ts-jest, Supertest for HTTP assertions
- **Node:** >= 18 required

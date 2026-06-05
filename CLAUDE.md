# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
api-gateway    (HTTP :3000)  — entry point for all client requests
    ├→ users-service         (TCP :4001)
    └→ products-service      (TCP :4002)
```

- **api-gateway** (`apps/api-gateway`): Express-based HTTP server. Registers `users-service` and `products-service` as TCP microservice clients via `ClientsModule`. Service identifiers are in `src/constants.ts` (`MICROSERVICES.USERS_SERVICE`, `MICROSERVICES.PRODUCTS_SERVICE`).
- **users-service** (`apps/users-service`): NestJS microservice, TCP transport on port 4001.
- **products-service** (`apps/products-service`): NestJS microservice, TCP transport on port 4002.

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

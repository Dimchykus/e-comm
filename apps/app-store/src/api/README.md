# API layer

Typed `@tanstack/react-query` hooks generated from the API Gateway's OpenAPI doc
with [Orval](https://orval.dev) over `axios`.

## Regenerating

1. Start the gateway so the spec is served at `http://localhost:4000/docs-json`
   (from the repo root: `turbo run start:dev --filter=api-gateway`).
2. From `apps/app-store`: `npm run gen:api`

Config lives in `orval.config.ts`. Generated code is written to
`src/api/generated/` and is overwritten on every run — don't edit it by hand.
Point at a different spec with `API_SPEC_URL=... npm run gen:api`.

> Generation runs through `scripts/gen-api.mjs` (Orval's programmatic API)
> instead of the `orval` CLI, because the CLI's `@commander-js/extra-typings`
> dependency clashes with Expo's hoisted `commander@7`.

## Usage

```tsx
import { useProductsControllerFindAll, useAuthControllerLogin } from '@/api';

function Products() {
  const { data, isLoading } = useProductsControllerFindAll({ page: 1 });
  // ...
}
```

GET endpoints become `useQuery` hooks; POST/PATCH/PUT/DELETE become
`useMutation` hooks.

## Auth & base URL

- Set the gateway URL via `EXPO_PUBLIC_API_URL` (see `.env.example`).
- After login, store the token with `setAuthToken(token)` (and `setAuthToken(null)`
  on logout) — the axios interceptor attaches it as a bearer header to every
  request.

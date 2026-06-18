import { defineConfig } from 'orval';

/**
 * Generates a typed @tanstack/react-query client (hooks + models) from the API
 * Gateway's OpenAPI document.
 *
 * Make sure the gateway is running first (Swagger JSON is served at
 * http://localhost:4000/docs-json), then run `npm run gen:api`.
 *
 * Override the spec location with the API_SPEC_URL env var if needed.
 */
export default defineConfig({
  ecomm: {
    input: {
      target: process.env.API_SPEC_URL ?? 'http://localhost:4000/docs-json',
    },
    output: {
      mode: 'tags-split',
      target: './src/api/generated',
      schemas: './src/api/generated/model',
      client: 'react-query',
      httpClient: 'axios',
      clean: true,
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write',
    },
  },
});

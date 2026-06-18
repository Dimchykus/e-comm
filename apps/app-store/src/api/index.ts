// Public entry point for the API layer.
//
// Import generated hooks and models from here, e.g.:
//   import { useProductsControllerFindAll, useAuthControllerLogin } from '@/api';
//
// Generated code lives in ./generated and is produced by `npm run gen:api`
// (do not edit it by hand).
export * from './generated/auth/auth';
export * from './generated/products/products';
export * from './generated/users/users';
export * from './generated/model';

export { queryClient } from './query-client';
export { setAuthToken, AXIOS_INSTANCE } from './mutator/custom-instance';

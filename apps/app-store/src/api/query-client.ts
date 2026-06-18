import { QueryClient } from '@tanstack/react-query';

/**
 * Single shared QueryClient for the app. Tune defaults here (retries, stale
 * times, etc.). Created once at module load so it survives re-renders.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
    },
  },
});

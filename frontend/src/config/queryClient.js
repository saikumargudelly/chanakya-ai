import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Data is considered fresh for 5 minutes
      cacheTime: 30 * 60 * 1000, // Cache persists for 30 minutes
      retry: (failureCount, error) => {
        // Don't retry on 404s or auth errors
        if (error?.response?.status === 404 || error?.response?.status === 401) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      suspense: true,
    },
    mutations: {
      retry: 1,
      onError: (error, variables, context) => {
        console.error('Mutation error:', error);
        // Add any global error handling here
      },
    },
  },
});
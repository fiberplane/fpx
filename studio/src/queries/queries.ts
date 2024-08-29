import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {},
    queries: {
      staleTime: 20 * 60 * 1000, // 20 minutes in milliseconds
      gcTime: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    },
  },
});
export { QueryClientProvider };

export const MIZU_TRACES_KEY = "mizuTraces";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const queryClient = new QueryClient();

export { QueryClientProvider };

export const MIZU_TRACES_KEY = "mizuTraces";

import type { ApiResponse, Trace } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";

export const TRACES_KEY = "traces";

export const tracesQueryOptions = () => ({
  queryKey: [TRACES_KEY],
  queryFn: () => api.getTraces(),
  select: (response: ApiResponse<Trace[]>) => response.data,
});

export function useTraces() {
  return useQuery(tracesQueryOptions());
}

export const traceQueryOptions = (traceId: string) => ({
  queryKey: [TRACES_KEY, traceId],
  queryFn: () => api.getTrace(traceId),
  select: (response: ApiResponse<Trace>) => response.data,
  enabled: !!traceId,
});

export function useTrace(id: string) {
  return useQuery(traceQueryOptions(id));
}

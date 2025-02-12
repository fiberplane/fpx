import type { ApiResponse } from "@/types";
import type {
  TraceDetailSpansResponse,
  TraceListResponse,
} from "@fiberplane/fpx-types";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";

export const TRACES_KEY = "traces";

export const tracesQueryOptions = (isEnabled: boolean) => ({
  queryKey: [TRACES_KEY],
  queryFn: () => api.getTraces(),
  // TODO - use TraceListResponseSchema to parse response
  select: (response: ApiResponse<TraceListResponse>) => response.data,
  enabled: isEnabled,
});

export function useTraces(isEnabled: boolean) {
  return useQuery(tracesQueryOptions(isEnabled));
}

export const traceQueryOptions = (traceId: string) => ({
  queryKey: [TRACES_KEY, traceId],
  queryFn: () => api.getTrace(traceId),
  select: (response: ApiResponse<TraceDetailSpansResponse>) => response.data,
  enabled: !!traceId,
});

export function useTrace(id: string) {
  return useQuery(traceQueryOptions(id));
}

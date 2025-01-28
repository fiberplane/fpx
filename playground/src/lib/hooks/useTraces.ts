import type { ApiResponse } from "@/types";
import type {
  TraceDetailSpansResponse,
  TraceListResponse,
} from "@fiberplane/fpx-types";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";

export const TRACES_KEY = "traces";

export const tracesQueryOptions = (fpxEndpoint: string) => ({
  queryKey: [TRACES_KEY],
  queryFn: () => api.getTraces(fpxEndpoint),
  // TODO - use TraceListResponseSchema to parse response
  select: (response: ApiResponse<TraceListResponse>) => response.data,
  enabled: !!fpxEndpoint,
});

export function useTraces(fpxEndpoint: string) {
  return useQuery(tracesQueryOptions(fpxEndpoint));
}

export const traceQueryOptions = (fpxEndpoint: string, traceId: string) => ({
  queryKey: [TRACES_KEY, traceId],
  queryFn: () => api.getTrace(fpxEndpoint, traceId),
  select: (response: ApiResponse<TraceDetailSpansResponse>) => response.data,
  enabled: !!fpxEndpoint && !!traceId,
});

export function useTrace(fpxEndpoint: string, id: string) {
  return useQuery(traceQueryOptions(fpxEndpoint, id));
}

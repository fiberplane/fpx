import type { ApiResponse } from "@/types";
import type {
  TraceDetailSpansResponse,
  TraceListResponse,
} from "@fiberplane/fpx-types";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";

export const TRACES_KEY = "traces";

export const tracesQueryOptions = (fpxEndpointHost: string) => ({
  queryKey: [TRACES_KEY],
  queryFn: () => api.getTraces(fpxEndpointHost),
  // TODO - use TraceListResponseSchema to parse response
  select: (response: ApiResponse<TraceListResponse>) => response.data,
  enabled: !!fpxEndpointHost,
});

export function useTraces(fpxEndpointHost: string) {
  return useQuery(tracesQueryOptions(fpxEndpointHost));
}

export const traceQueryOptions = (
  fpxEndpointHost: string,
  traceId: string,
) => ({
  queryKey: [TRACES_KEY, traceId],
  queryFn: () => api.getTrace(fpxEndpointHost, traceId),
  select: (response: ApiResponse<TraceDetailSpansResponse>) => response.data,
  enabled: !!fpxEndpointHost && !!traceId,
});

export function useTrace(fpxEndpointHost: string, id: string) {
  return useQuery(traceQueryOptions(fpxEndpointHost, id));
}

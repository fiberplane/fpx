import { useApiBaseUrl } from "@/hooks";
import {
  OtelSpanSchema,
  type TraceListResponse,
  TraceListResponseSchema,
} from "@fiberplane/fpx-types";
import { type QueryFunctionContext, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { MIZU_TRACES_KEY } from "./queries";

export const TRACES_KEY = "otelTrace";

export function useOtelTrace(traceId: string) {
  const apiBaseUrl = useApiBaseUrl();

  return useQuery({
    queryKey: [TRACES_KEY, traceId],
    queryFn: fetchOtelTrace.bind(null, apiBaseUrl),
  });
}

const SpansSchema = z.array(OtelSpanSchema);

async function fetchOtelTrace(
  apiBaseUrl: string,
  context: QueryFunctionContext<[string, string]>,
) {
  const traceId = context.queryKey[1];
  const response = await fetch(`${apiBaseUrl}/v1/traces/${traceId}/spans`, {
    mode: "cors",
  });
  const json = await response.json();
  return SpansSchema.parse(json);
}

export function useOtelTraces() {
  const apiBaseUrl = useApiBaseUrl();

  const result = useQuery({
    queryKey: [MIZU_TRACES_KEY],
    queryFn: async (): Promise<TraceListResponse> => {
      const response = await fetch(`${apiBaseUrl}/v1/traces`);
      const json = await response.json();
      return TraceListResponseSchema.parse(json);
    },
  });

  return result;
}

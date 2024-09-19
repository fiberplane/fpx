import {
  OtelSpanSchema,
  type OtelTrace,
  type TraceDetailSpansResponse,
  type TraceListResponse,
} from "@fiberplane/fpx-types";
import { type QueryFunctionContext, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { MIZU_TRACES_KEY } from "./queries";

export const TRACES_KEY = "otelTrace";

export function useOtelTrace(traceId: string) {
  return useQuery({
    queryKey: [TRACES_KEY, traceId],
    queryFn: fetchOtelTrace,
  });
}

const SpansSchema = z.array(OtelSpanSchema);

async function fetchOtelTrace(context: QueryFunctionContext<[string, string]>) {
  const traceId = context.queryKey[1];
  const response = await fetch(`/v1/traces/${traceId}/spans`, {
    mode: "cors",
  });
  const json = (await response.json()) as TraceDetailSpansResponse;
  return SpansSchema.parse(json);
}

export function useOtelTraces() {
  return useQuery({
    queryKey: [MIZU_TRACES_KEY],
    queryFn: async (): Promise<OtelTrace[]> => {
      const response = await fetch("/v1/traces");
      const json = (await response.json()) as TraceListResponse;
      return json;
    },
  });
}

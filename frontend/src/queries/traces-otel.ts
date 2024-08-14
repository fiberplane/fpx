import { OtelSpan, OtelSpanSchema, OtelTrace, SpansSchema } from "@fiberplane/fpx-types";
import { QueryFunctionContext, useQuery } from "@tanstack/react-query";
import { MIZU_TRACES_KEY } from "./queries";

export const TRACES_KEY = "otelTrace";

export function useOtelTrace(traceId: string) {
  return useQuery({
    queryKey: [TRACES_KEY, traceId],
    queryFn: fetchOtelTrace,
  });
}

async function fetchOtelTrace(context: QueryFunctionContext<[string, string]>) {
  const traceId = context.queryKey[1];
  return fetch(`/v1/traces/${traceId}/spans`, {
    mode: "cors",
  })
    .then((response) => response.json())
    .then((spans: { parsedPayload: unknown }[]) =>
      spans.map((span) => span.parsedPayload),
    )
    .then((spans) => {
      // For inspection, uncomment the following line:
      // console.log("spans", spans);
      return spans;
    })
    .then((data) => SpansSchema.parse(data));
}

export function useOtelTraces() {
  return useQuery({
    queryKey: [MIZU_TRACES_KEY],
    queryFn: async (): Promise<OtelTrace[]> => {
      const response = await fetch("/v1/traces");
      const json = await response.json();

      return json.map(
        (t: {
          traceId: string;
          spans: { parsedPayload: unknown; rawPayload: unknown; }[];
        }) => {
          return {
            traceId: t.traceId,
            spans: t.spans.map((span) => toOtelSpan(span.parsedPayload, span.rawPayload)),
          };
        });
    },
  });
}

function toOtelSpan(
  t: unknown,
  rawPayload: unknown,
): (OtelSpan & { rawPayload: unknown }) | null {
  const result = OtelSpanSchema.safeParse(t);
  if (!result.success) {
    console.error("OtelSpanSchema parse error:", result.error.format());
    return null;
  }
  return {
    ...result.data,
    rawPayload,
  };
}

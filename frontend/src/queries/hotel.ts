import { useQuery } from "@tanstack/react-query";
import { OtelSpan, OtelSpanSchema } from "./traces-otel";

export function useOtelTraces() {
  return useQuery({
    queryKey: ["otel-traces"],
    queryFn: (): Promise<OtelSpan[]> => {
      return fetch("/v1/traces")
        .then((res) => res.json())
        .then((r) => {
          console.log("Otel Traces before decoding:", r);
          return r;
        })
        .then((r) =>
          r.map((r: { parsedPayload: unknown; rawPayload: unknown }) =>
            toOtelSpan(r?.parsedPayload, r?.rawPayload),
          ),
        );
    },
  });
}

function toOtelSpan(t: unknown, rawPayload: unknown): OtelSpan | null {
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

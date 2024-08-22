import type { OtelSpan } from "./otel.js";

export type TraceListResponse = Array<{
  traceId: string,
  spans: Array<OtelSpan>,
}>;

export type TraceDetailSpansResponse = Array<OtelSpan>;

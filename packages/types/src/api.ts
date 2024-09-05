import type { OtelSpan } from "./otel.js";

export type TraceSummary = {
  traceId: string;
  spans: Array<OtelSpan>;
};

export type TraceListResponse = Array<TraceSummary>;

export type TraceDetailSpansResponse = Array<OtelSpan>;

import type { OtelSpan } from "./otel.js";

export type TraceListResponse = Array<{
  traceId: string;
  startTime: Date;
  endTime: Date;
  spans: Array<OtelSpan>;
}>;

export type TraceDetailSpansResponse = Array<OtelSpan>;

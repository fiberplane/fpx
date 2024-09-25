import { z } from "zod";
import { type OtelSpan, OtelSpanSchema } from "./otel.js";

export const TraceSummarySchema = z.object({
  traceId: z.string(),
  spans: z.array(OtelSpanSchema),
});
export type TraceSummary = z.infer<typeof TraceSummarySchema>;

export const TraceListResponseSchema = z.array(TraceSummarySchema);
export type TraceListResponse = z.infer<typeof TraceListResponseSchema>;

export type TraceDetailSpansResponse = Array<OtelSpan>;

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

export const GroupSchema = z.object({
  id: z.number(),
  name: z.string().trim().min(1, { message: 'Is required.' }),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type Group = z.infer<typeof GroupSchema>;

export const GroupListResponseSchema = z.array(GroupSchema);
export type GroupListResponse = z.infer<typeof GroupListResponseSchema>;

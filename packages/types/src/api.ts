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

export const CollectionSchema = z.object({
  id: z.number(),
  name: z.string().trim().min(1, { message: "Is required." }),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Collection = z.infer<typeof CollectionSchema>;

export const CollectionListResponseSchema = z.array(CollectionSchema);
export type CollectionListResponse = z.infer<
  typeof CollectionListResponseSchema
>;

export const JsonSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonSchema),
    z.record(JsonSchema),
  ]),
);

export type JsonSchemaType = z.infer<typeof JsonSchema>;

export const ExtraRequestParamsSchema = z.object({
  name: z.string().optional(),
  requestUrl: z.string().optional(),
  requestMethod: z.string().optional(),
  requestRoute: z.string().optional(),
  requestHeaders: z.record(z.string()).optional(),
  requestQueryParams: z.record(z.string()).optional(),
  requestPathParams: z.record(z.string()).optional(),
  requestBody: JsonSchema.optional(), // Assuming JsonSchemaType can be any type
});

export type ExtraRequestParams = z.infer<typeof ExtraRequestParamsSchema>;

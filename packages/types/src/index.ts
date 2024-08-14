import { z } from "zod";

export const WsMessageSchema = z.discriminatedUnion("event", [
  z.object({
    event: z.literal("trace_created"),
    // TODO: this should be an array of traces instead of the queryKeys to invalidate on the browser
    payload: z.array(z.literal("mizuTraces")),
  }),
  z.object({
    event: z.literal("connection_open"),
    payload: z.object({
      connectionId: z.string(),
    }),
  }),
  z.object({
    event: z.literal("request_incoming"),
    payload: z.object({
      headers: z.record(z.string()),
      query: z.record(z.string()),
      path: z.array(z.string()),
      body: z.any(),
      method: z.string(),
    }),
  }),
]);

export type WsMessage = z.infer<typeof WsMessageSchema>;

export const OtelAttributesSchema = z.record(
  z.string(),
  z.union([
    z.object({
      String: z.string(),
    }),
    z.string(),
    z.object({
      Int: z.number(),
    }),
    z.number(),
    // z.boolean(),
    // z.null(),
    // z.undefined(),
    // z.record(
    //   z.string(),
    //   z.union([
    //     z.string(),
    //     z.number(),
    //     z.null()
    //   ])
    // ),
  ]),
);

export type OtelAttributes = z.infer<typeof OtelAttributesSchema>;

export const OtelStatusSchema = z.object({
  code: z.number(),
  message: z.string().nullish(),
});

export type OtelStatus = z.infer<typeof OtelStatusSchema>;

export const OtelEventSchema = z.object({
  name: z.string(),
  timestamp: z.string(), // ISO 8601 format
  attributes: OtelAttributesSchema,
});

export type OtelEvent = z.infer<typeof OtelEventSchema>;

export const OtelSpanSchema = z
  .object({
    trace_id: z.string(),
    span_id: z.string(),
    parent_span_id: z.union([z.string(), z.null()]),
    name: z.string(),
    trace_state: z.string().nullish(),
    flags: z.number().optional(), // This determines whether or not the trace will be sampled
    kind: z.string(),
    start_time: z.string(), // ISO 8601 format
    end_time: z.string(), // ISO 8601 format
    attributes: OtelAttributesSchema,
    status: OtelStatusSchema.optional(),

    // This is where we will store logs that happened along the way
    events: z.array(OtelEventSchema),

    // Links to related traces, etc
    links: z.array(
      z.object({
        trace_id: z.string(),
        span_id: z.string(),
        trace_state: z.string(),
        attributes: OtelAttributesSchema,
        flags: z.number().optional(),
      }),
    ),
  })
  .passthrough(); // HACK - Passthrough to vendorify traces


export const SpansSchema = z.array(OtelSpanSchema);

export type OtelSpan = z.infer<typeof OtelSpanSchema>;

export type OtelSpans = z.infer<typeof SpansSchema>;

export const OtelTraceSchema = z.object({
  traceId: z.string(),
  spans: SpansSchema,
});

export type OtelTrace = z.infer<typeof OtelTraceSchema>;

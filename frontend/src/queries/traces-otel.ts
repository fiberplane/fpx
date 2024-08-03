import { QueryFunctionContext, useQuery } from "@tanstack/react-query";
import { z } from "zod";

const OtelAttributesSchema = z.record(
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

const OtelStatusSchema = z.object({
  code: z.number(),
  message: z.string().nullish(),
});

export type OtelStatus = z.infer<typeof OtelStatusSchema>;

const OtelEventSchema = z.object({
  name: z.string(),
  timestamp: z.string(), // ISO 8601 format
  attributes: OtelAttributesSchema,
});

export type OtelEvent = z.infer<typeof OtelEventSchema>;

export const OtelSpanSchema = z.object({
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
      flags: z.number(),
    }),
  ),
});

export const TRACES_KEY = "otelTrace";

export function useOtelTrace(traceId: string) {
  return useQuery({
    queryKey: [TRACES_KEY, traceId],
    queryFn: fetchOtelTrace,
  });
}

const SpansSchema = z.array(OtelSpanSchema);

export type OtelSpan = z.infer<typeof OtelSpanSchema>;
export type OtelSpans = z.infer<typeof SpansSchema>;

async function fetchOtelTrace(context: QueryFunctionContext<[string, string]>) {
  const traceId = context.queryKey[1];
  return fetch(`/v1/traces/${traceId}/spans`, {
    mode: "cors",
  })
    .then((response) => response.json())
    .then((data) => SpansSchema.parse(data));
}

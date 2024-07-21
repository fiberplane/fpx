import { z } from "zod";

const OtelAttributesSchema = z.record(z.union([z.string(), z.number(), z.boolean(), z.null(), z.undefined()]));

const OtelStatusSchema = z.object({
  code: z.string(),
  message: z.string(),
});

export type OtelStatus = z.infer<typeof OtelStatusSchema>;

export const OtelSpanSchema = z.object({
  trace_id: z.string(),
  span_id: z.string(),
  parent_span_id: z.string().optional(),
  name: z.string(),
  trace_state: z.string(),
  flags: z.number(), // This determines whether or not the trace will be sampled
  kind: z.string(),
  start_time: z.string(), // ISO 8601 format
  end_time: z.string(), // ISO 8601 format
  attributes: OtelAttributesSchema,
  status: OtelStatusSchema.optional(),

  // This is where we will store logs that happened along the way
  events: z.array(
    z.object({
      name: z.string(),
      timestamp: z.string(), // ISO 8601 format
      attributes: OtelAttributesSchema,
    })
  ),

  // Links to related traces, etc
  links: z.array(
    z.object({
      trace_id: z.string(),
      span_id: z.string(),
      trace_state: z.string(),
      attributes: OtelAttributesSchema,
      flags: z.number(),
    })
  ),
})

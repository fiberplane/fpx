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

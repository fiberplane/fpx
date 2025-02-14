import { z } from "zod";
import type { PlaygroundBodySchema } from "./request-body";
import type { StudioState } from "./slices";

const PlaygroundResponseBodySchema = z.discriminatedUnion("type", [
  z.object({
    contentType: z.string(),
    type: z.literal("empty"),
  }),
  z.object({
    contentType: z.string(),
    type: z.literal("json"),
    // NOTE - we pass it as text
    value: z.string(),
  }),
  z.object({
    contentType: z.string(),
    type: z.literal("text"),
    value: z.string(),
  }),
  z.object({
    contentType: z.string(),
    type: z.literal("html"),
    value: z.string(),
  }),
  z.object({
    contentType: z.string(),
    type: z.literal("binary"),
    value: z.instanceof(ArrayBuffer),
  }),
  z.object({
    contentType: z.string(),
    type: z.literal("unknown"),
    value: z.string(),
  }),
  z.object({
    contentType: z.string(),
    type: z.literal("error"),
    value: z.null(),
  }),
]);

export type PlaygroundResponseBody = z.infer<
  typeof PlaygroundResponseBodySchema
>;

const PlaygroundActiveResponseSchema = z.object({
  traceId: z.string().nullable(),
  responseBody: PlaygroundResponseBodySchema,
  responseHeaders: z.record(z.string()).nullable(),
  responseStatusCode: z.string(),
  isFailure: z.boolean(),

  requestUrl: z.string(),
  requestMethod: z.string(),
});

export const isPlaygroundActiveResponse = (
  response: unknown,
): response is PlaygroundActiveResponse => {
  return PlaygroundActiveResponseSchema.safeParse(response).success;
};

export type PlaygroundActiveResponse = z.infer<
  typeof PlaygroundActiveResponseSchema
>;

export const KeyValueParameterSchema = z.object({
  id: z.string(),
  key: z.string(),
  value: z.string(),
  enabled: z.boolean(),
});

/**
 * A "key-value parameter" is a record containing `key` and `value` properties.
 * It can be used to represent things like query parameters or headers.
 */
export type KeyValueParameter = z.infer<typeof KeyValueParameterSchema>;

export type PlaygroundState = StudioState;

export type PlaygroundBody = z.infer<typeof PlaygroundBodySchema>;
export type NavigationRoutesView = "list" | "fileTree";

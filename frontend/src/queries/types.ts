import { z } from "zod";

// TODO: figure out if this is really the only type of k/v pair we want to support
export const KeyValueSchema = z.record(z.string());

const MizuRequestStartSchema = z
  .object({
    lifecycle: z.literal("request"),
    method: z.string(),
    path: z.string(),
    headers: KeyValueSchema,
    body: z.string().optional(),
    file: z.string().optional(),
    env: KeyValueSchema.nullish(),
    params: z.record(z.string()).nullish(),
    query: z.record(z.string()).nullish(),
  })
  .passthrough();

const MizuRequestEndSchema = z
  .object({
    lifecycle: z.literal("response"),
    status: z.string(),
    headers: z.record(z.string()),
    body: z.string(),
    elapsed: z.string(), // mem: human readable
    handler: z.string().optional(),
    route: z.string(),
  })
  .passthrough();

// Define the init object schema
const FetchInitSchema = z
  .object({
    method: z.string().optional(),
    headers: z.record(z.string()).optional(),
    body: z.string().nullish(),
    mode: z.enum(["cors", "no-cors", "same-origin"]).optional(),
    credentials: z.enum(["omit", "same-origin", "include"]).optional(),
    cache: z
      .enum([
        "default",
        "no-store",
        "reload",
        "no-cache",
        "force-cache",
        "only-if-cached",
      ])
      .optional(),
    redirect: z.enum(["follow", "error", "manual"]).optional(),
    referrer: z.string().optional(),
    referrerPolicy: z
      .enum([
        "",
        "no-referrer",
        "no-referrer-when-downgrade",
        "same-origin",
        "origin",
        "strict-origin",
        "origin-when-cross-origin",
        "strict-origin-when-cross-origin",
        "unsafe-url",
      ])
      .optional(),
    integrity: z.string().optional(),
    keepalive: z.boolean().optional(),
    signal: z.instanceof(AbortSignal).optional(),
  })
  .partial();

// Define the fetch arguments schema
const FetchArgumentsSchema = z.union([
  z.tuple([z.union([z.string(), z.instanceof(URL), z.instanceof(Request)])]),
  z.tuple([
    z.union([z.string(), z.instanceof(URL), z.instanceof(Request)]),
    FetchInitSchema,
  ]),
]);

const MizuFetchStartSchema = z
  .object({
    lifecycle: z.literal("fetch_start"),
    requestId: z.string(),
    start: z.number(),
    url: z.string(),
    method: z.string(),
    body: z.string().nullable(),
    headers: z.record(z.string()),
    args: FetchArgumentsSchema,
  })
  .passthrough();

const MizuFetchEndSchema = z
  .object({
    lifecycle: z.literal("fetch_end"),
    requestId: z.string(),
    end: z.number(),
    elapsed: z.number(),
    url: z.string(),
    status: z.number(),
    statusText: z.string(),
    headers: z.record(z.string()),
    body: z.string().nullable(),
  })
  .passthrough();

const MizuFetchErrorSchema = z
  .object({
    lifecycle: z.literal("fetch_error"),
    requestId: z.string(),
    status: z.number(),
    statusText: z.string(),
    headers: z.record(z.string()),
    body: z.string().nullable(),
    url: z.string(),
  })
  .passthrough();

// TODO MizuFetchLoggingErrorSchema

const MizuReqResMessageSchema = z.discriminatedUnion("lifecycle", [
  MizuRequestStartSchema,
  MizuRequestEndSchema,
]);

const MizuFetchMessageSchema = z.discriminatedUnion("lifecycle", [
  MizuFetchStartSchema,
  MizuFetchEndSchema,
  MizuFetchErrorSchema,
  // MizuFetchLoggingErrorSchema,
]);

// TODO - tie to level: error
const MizuErrorMessageSchema = z.object({
  message: z.string(),
  stack: z.string().optional(),
  name: z.string(),
});

const MizuKnownMessageSchema = z.union([
  MizuReqResMessageSchema,
  MizuFetchMessageSchema,
  MizuErrorMessageSchema,
]);

const MizuMessageSchema = z.union([
  MizuKnownMessageSchema,
  z.string(),
  z
    .object({})
    .passthrough(), // HACK - catch all other messages
]);

const CallerLocationSchema = z.object({
  file: z.string(),
  line: z.string(),
  column: z.string(),
});

export const MizuLogSchema = z.object({
  id: z.number(),
  traceId: z.string(),
  timestamp: z.string(),
  level: z.string(), // TODO - use enum from db schema?
  message: MizuMessageSchema,
  args: z.unknown().nullish(), // NOTE - arguments passed to console.*
  callerLocation: CallerLocationSchema.nullish(),
  ignored: z.boolean().nullish(),
  service: z.string().nullish(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const MizuTraceSchema = z.object({
  id: z.string(),
  description: z.string(),
  status: z.string(),
  duration: z.string(),
  logs: z.array(MizuLogSchema),
});

export type KeyValue = z.infer<typeof KeyValueSchema>;
export type MizuTrace = z.infer<typeof MizuTraceSchema>;
export type MizuLog = z.infer<typeof MizuLogSchema>;
export type MizuMessage = z.infer<typeof MizuMessageSchema>;
export type CallerLocation = z.infer<typeof CallerLocationSchema>;

// Types of `MizuLog["message"]`
export type MizuRequestStart = z.infer<typeof MizuRequestStartSchema>;
export type MizuRequestEnd = z.infer<typeof MizuRequestEndSchema>;
export type MizuErrorMessage = z.infer<typeof MizuErrorMessageSchema>;

export const isMizuRequestStartMessage = (
  message: unknown,
): message is MizuRequestStart => {
  const result = MizuRequestStartSchema.safeParse(message);
  return result.success;
};

export const isMizuRequestEndMessage = (
  message: unknown,
): message is MizuRequestEnd => {
  const result = MizuRequestEndSchema.safeParse(message);
  return result.success;
};

export const isMizuFetchStartMessage = (
  message: unknown,
): message is z.infer<typeof MizuFetchStartSchema> => {
  return MizuFetchStartSchema.safeParse(message).success;
};

export const isMizuFetchEndMessage = (
  message: unknown,
): message is z.infer<typeof MizuFetchEndSchema> => {
  return MizuFetchEndSchema.safeParse(message).success;
};

export const isMizuFetchErrorMessage = (
  message: unknown,
): message is z.infer<typeof MizuFetchErrorSchema> => {
  return MizuFetchErrorSchema.safeParse(message).success;
};

export const isMizuErrorMessage = (
  message: unknown,
): message is z.infer<typeof MizuErrorMessageSchema> => {
  return MizuErrorMessageSchema.safeParse(message).success;
};

export const isKnownMizuMessage = (
  message: unknown,
): message is z.infer<typeof MizuKnownMessageSchema> => {
  return MizuKnownMessageSchema.safeParse(message).success;
};

export const MizuApiLogResponseSchema = z.object({
  logs: z.array(MizuLogSchema),
});

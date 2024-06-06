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

const MizuReqResMessageSchema = z.discriminatedUnion("lifecycle", [
  MizuRequestStartSchema,
  MizuRequestEndSchema,
]);

// TODO - tie to level: error
const MizuErrorMessageSchema = z.object({
  message: z.string(),
  stack: z.string().optional(),
  name: z.string(),
});

const MizuKnownMessageSchema = z.union([
  MizuReqResMessageSchema,
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

export const GitHubLabelSchema = z.union([
  z.string(),
  z.object({
    id: z.number().optional(),
    node_id: z.string().optional(),
    url: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    color: z.string().optional(),
    default: z.boolean().optional(),
  }),
]);

export const GitHubIssueSchema = z.object({
  id: z.number(),
  owner: z.string(),
  repo: z.string(),
  url: z.string(),
  title: z.string(),
  body: z.string(),
  state: z.enum(["open", "closed"]),
  labels: z.array(GitHubLabelSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
  closedAt: z.string(),
});

export const GitHubIssuesSchema = z.array(GitHubIssueSchema);

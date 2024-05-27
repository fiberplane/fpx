import { z } from "zod";

// export type MizuTrace = {
//   id: string;
//   description: string;
//   status: string;
//   duration: string;
//   logs: Array<MizuLog>;
// };

// export type MizuLog =
//   | {
//     id: number;
//     traceId: string;
//     timestamp: string;
//     level: string;
//     message: JsonValue;
//     args?: JsonValue;
//     createdAt: string;
//   }
//   | {
//     id: number;
//     traceId: string;
//     timestamp: string;
//     level: string;
//     message: string;
//     createdAt: string;
//     args?: JsonValue;
//     callerLocation?: null | {
//       file: string;
//       line: string;
//       column: string;
//     },
//     log: unknown;
//   };

/**
 {
//     id: number;
//     traceId: string;
//     timestamp: string;
//     level: string;
//     message: JsonValue;
//     args?: JsonValue;
//     createdAt: string;
//   }
 */

const MizuRequestStartSchema = z.object({
  lifecycle: z.literal("request"),
  method: z.string(),
  path: z.string(),
  headers: z.record(z.string()),
  body: z.string().optional(),
  file: z.string().optional(),
  env: z.record(z.string()).nullish(),
  params: z.record(z.string()).nullish(),
  query: z.record(z.string()).nullish(),
}).passthrough();

const MizuRequestEndSchema = z.object({
  lifecycle: z.literal("response"),
  status: z.string(),
  headers: z.record(z.string()),
  body: z.string(),
  elapsed: z.string(), // mem: human readable
  handler: z.string().optional(),
  route: z.string(),
}).passthrough();

const MizuReqResMessasgeSchema = z.discriminatedUnion("lifecycle", [
  MizuRequestStartSchema,
  MizuRequestEndSchema,
]);

// TODO - tie to level: error
const MizuErrorMessasgeSchema = z.object({
  message: z.string(),
  stack: z.string().optional(),
  name: z.string(),
});

const MizuMessasgeSchema = z.union([
  z.string(),
  MizuReqResMessasgeSchema, // TODO
  MizuErrorMessasgeSchema,
  z.object({}).passthrough(), // HACK - catch all other messages
]);

export const MizuLogSchema = z.object({
  id: z.number(),
  traceId: z.string(),
  timestamp: z.string(),
  level: z.string(), // TODO - use enum from db schema?
  message: MizuMessasgeSchema,
  args: z.unknown().nullish(), // NOTE - arguments passed to console.*
  callerLocation: z.object({
    file: z.string(),
    line: z.string(),
    column: z.string(),
  }).nullish(),
  ignored: z.boolean().nullish(),
  service: z.string().nullish(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type MizuLog = z.infer<typeof MizuLogSchema>;

// Types of `MizuLog["message"]`
export type MizuRequestStart = z.infer<typeof MizuRequestStartSchema>;
export type MizuRequestEnd = z.infer<typeof MizuRequestEndSchema>;

export const isMizuRequestStartMessage = (message: unknown): message is MizuRequestStart => {
  const result = MizuRequestStartSchema.safeParse(message);
  return result.success;
};

export const isMizuRequestEndMessage = (message: unknown): message is MizuRequestEnd => {
  const result = MizuRequestEndSchema.safeParse(message);
  return result.success;
};
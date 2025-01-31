/**
 * This is a temporary module that supports the MizuOrphanLog type,
 * which is used to display logs in the RequestDetailsPage.
 */

import { z } from "zod";

const CallerLocationSchema = z.object({
  file: z.string().nullish(),
  line: z.number().nullish(),
  column: z.number().nullish(),
  methodName: z.string().nullish(),
  arguments: z.array(z.string()).nullish(),
});

export type CallerLocation = z.infer<typeof CallerLocationSchema>;

const MizuOrphanLogSchema = z.object({
  id: z.number(),
  traceId: z.string(),
  isException: z.boolean().nullish(),
  timestamp: z.coerce.date(),
  level: z.string(), // TODO - use enum from db schema?
  message: z.union([z.string(), z.null()]),
  args: z.array(z.unknown()), // NOTE - arguments passed to console.*
  callerLocations: z.array(CallerLocationSchema).nullish(),
  ignored: z.boolean().nullish(),
  service: z.string().nullish(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  relatedSpanId: z.string().nullish(),
});

export type MizuOrphanLog = z.infer<typeof MizuOrphanLogSchema>;

export const isMizuOrphanLog = (log: unknown): log is MizuOrphanLog => {
  return MizuOrphanLogSchema.safeParse(log).success;
};

import { z } from "zod";

const CallerLocationSchema = z.object({
  file: z.string(),
  line: z.string(),
  column: z.string(),
});

const MizuOrphanLogSchema = z.object({
  id: z.number(),
  traceId: z.string(),
  timestamp: z.string(),
  level: z.string(), // TODO - use enum from db schema?
  message: z.union([z.string(), z.null()]),
  args: z.array(z.unknown()), // NOTE - arguments passed to console.*
  callerLocation: CallerLocationSchema.nullish(),
  ignored: z.boolean().nullish(),
  service: z.string().nullish(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type MizuOrphanLog = z.infer<typeof MizuOrphanLogSchema>;

export const isMizuOrphanLog = (log: unknown): log is MizuOrphanLog => {
  return MizuOrphanLogSchema.safeParse(log).success;
};

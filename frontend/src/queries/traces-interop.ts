import { z } from "zod";

import { MizuErrorMessageSchema, MizuLogSchema } from "./types";

const MizuOrphanLogMessageSchema = z.union([
  MizuErrorMessageSchema,
  z.string(),
  z.null(),
]);

const MizuOrphanLogSchema = MizuLogSchema.omit({ message: true }).extend({
  message: MizuOrphanLogMessageSchema,
});

export type MizuOrphanLog = z.infer<typeof MizuOrphanLogSchema>;

export const isMizuOrphanLog = (log: unknown): log is MizuOrphanLog => {
  return MizuOrphanLogSchema.safeParse(log).success;
};

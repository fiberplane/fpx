import { z } from "zod";

import {
  MizuErrorMessageSchema,
  MizuFetchMessageSchema,
  MizuLogSchema,
  MizuReqResMessageSchema,
} from "./types";

const MizuSpannableMessageSchema = z.union([
  MizuReqResMessageSchema,
  MizuFetchMessageSchema,
]);

const MizuOrphanLogMessageSchema = z
  .union([
    MizuErrorMessageSchema,
    z.string(),
    z.null(),
    z
      .object({})
      .passthrough(), // HACK - catch all other messages
  ])
  .refine((data) => !MizuSpannableMessageSchema.safeParse(data).success, {
    message: "Log entry should not be spannable",
  });

const MizuOrphanLogSchema = MizuLogSchema.omit({ message: true }).extend({
  message: MizuOrphanLogMessageSchema,
});

export type MizuOrphanLog = z.infer<typeof MizuOrphanLogSchema>;

export const isMizuOrphanLog = (log: unknown): log is MizuOrphanLog => {
  return MizuOrphanLogSchema.safeParse(log).success;
};

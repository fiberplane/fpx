import { z } from "zod";

export const SettingsSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("fpxWorkerProxy"),
    url: z.string().url(),
  }),
]);

export type Settings = z.infer<typeof SettingsSchema>;

export type SettingsKey = Settings["type"];

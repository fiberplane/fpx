import { z } from "zod";

export const SettingsSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("proxy_url"),
    url: z.string().url(),
  }),
  z.object({
    type: z.literal("some_test"),
    value: z.string(),
  }),
]);

export type Settings = z.infer<typeof SettingsSchema>;

export type SettingsKey = Settings["type"];

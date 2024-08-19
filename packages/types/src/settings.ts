import { z } from "zod";

// export const SettingSchema = z.discriminatedUnion("type", [
//   z.object({
//     type: z.literal("fpxWorkerProxy"),
//     url: z.string().url(),
//   }),
//   z.object({ type: z.literal('customRoutesEnabled'), value: z.boolean() }),
//   z.object({ type: z.literal('aiEnabled'), value: z.boolean() }),
//   z.object({ type: z.literal('aiProviderType'), value: z.any() }),
//   z.object({ type: z.literal('openaiBaseUrl'), value: z.any() }),
//   z.object({ type: z.literal('openaiModel'), value: z.any() }),
//   z.object({ type: z.literal('anthropicBaseUrl'), value: z.any() }),
//   z.object({ type: z.literal('anthropicModel'), value: z.any() }),
//   z.object({ type: z.literal('proxyRequestsEnabled'), value: z.boolean() }),
//   z.object({ type: z.literal('proxyBaseUrl'), value: z.any() }),
// ]);

// export type Setting = z.infer<typeof SettingSchema>;

// export type SettingsKey = Setting["type"];

// export type Settings = Partial<Record<SettingsKey, Omit<Extract<Setting, { type: SettingsKey }>, 'type'>>>;

export const SettingsSchema = z.object({
  fpxWorkerProxy: z.string().url(),
  customRoutesEnabled: z.boolean(),
  aiEnabled: z.boolean(),
  aiProviderType: z.any(),
  openaiBaseUrl: z.any(),
  openaiModel: z.any(),
  anthropicBaseUrl: z.any(),
  anthropicModel: z.any(),
  proxyRequestsEnabled: z.boolean(),
  proxyBaseUrl: z.any(),
});

export type Settings = z.infer<typeof SettingsSchema>;

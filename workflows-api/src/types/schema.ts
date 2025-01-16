import { z } from "zod";
import type { Step } from "./arazzo.js";

// OAI Schema types
export const oaiSchemaSchema = z.object({
  id: z.string(),
  name: z.string(),
  content: z.string(),
});

export type OAISchema = z.infer<typeof oaiSchemaSchema>;

// Workflow types
export const workflowCreateSchema = z.object({
  prompt: z.string(),
  oaiSchemaId: z.string(),
  name: z.string(),
  summary: z.string().optional(),
  description: z.string().optional(),
});

export const workflowSchema = workflowCreateSchema.extend({
  id: z.string(),
  arazzoSchema: z.string().optional(),
  steps: z.array(z.any() as unknown as z.ZodType<Step>),
  lastRunStatus: z.enum(["success", "pending", "error"]).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type WorkflowCreate = z.infer<typeof workflowCreateSchema>;
export type Workflow = z.infer<typeof workflowSchema>;

// API Response types
export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema,
  });

export const apiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
  }),
});

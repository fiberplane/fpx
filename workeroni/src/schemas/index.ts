import { z } from "zod";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type * as schema from "../db/schema.js";

export interface Variables {
  db: DrizzleD1Database<typeof schema>;
}

// Core workflow step types
export const stepParameterSchema = z.object({
  name: z.string().describe("Name of the parameter. Example: email"),
  value: z.string().describe("Value or reference to input/previous step output. Example: $.inputs.userEmail"),
});

export const stepSuccessCriteriaSchema = z.object({
  condition: z.string().describe("Success condition expression. Example: $response.statusCode === 200"),
});

export const stepOutputSchema = z.object({
  key: z.string().describe("Output key name. Example: userId"),
  value: z.string().describe("Path to value in response. Example: $response.body#/data/id"),
});

export const stepSchema = z.object({
  stepId: z.string().describe("A unique identifier for this step. Example: create-user"),
  description: z.string().describe("What this step does. Example: Create a new user account in the database"),
  operation: z.string().describe("The operationId from OpenAPI spec (e.g., createUser) or the path (e.g., /users/create)"),
  parameters: z.array(stepParameterSchema).default([]).describe("Parameters needed for the operation"),
  successCriteria: z.array(stepSuccessCriteriaSchema).default([]).describe("Conditions that must be met for the step to be considered successful"),
  outputs: z.array(stepOutputSchema).default([]).describe("Values to extract from the response for use in subsequent steps"),
});

// OpenAPI Schema types
export const openApiSchema = z.object({
  id: z.string().describe("Unique identifier for the OpenAPI schema"),
  name: z.string().describe("Display name for the schema. Example: User Service API"),
  content: z.string().describe("Full OpenAPI specification content"),
});

// Core workflow types
export const workflowSchema = z.object({
  id: z.string().describe("A unique identifier for the workflow. Example: loginUserAndCreateWorkflow"),
  prompt: z.string().describe("Original user story/prompt. Example: Create a workflow that registers a new user"),
  summary: z.string().describe("A very short summary of what the workflow does (acts as a name). Example: Process new user registration"),
  description: z.string().describe("A detailed description of the workflow's purpose and steps. Example: Handles the complete user registration flow including account creation and welcome email"),
  openApiSchemaId: z.string().describe("Reference to OpenAPI schema."),
  steps: z.array(stepSchema).min(1).describe("The sequence of API operations to perform"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// API request schemas
export const createWorkflowSchema = z.object({
  prompt: z.string(),
  openApiSchemaId: z.string(),
  summary: z.string().optional(),
  description: z.string().optional(),
});

// API response schemas
export const apiResponseSchema = <T extends z.ZodType>(schema: T) =>
  z.object({
    data: schema,
  });

export const apiErrorSchema = z.object({
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
  }),
});

// Export types
export type StepParameter = z.infer<typeof stepParameterSchema>;
export type StepSuccessCriteria = z.infer<typeof stepSuccessCriteriaSchema>;
export type StepOutput = z.infer<typeof stepOutputSchema>;
export type Step = z.infer<typeof stepSchema>;
export type OpenApiSchema = z.infer<typeof openApiSchema>;
export type Workflow = z.infer<typeof workflowSchema>;
export type CreateWorkflow = z.infer<typeof createWorkflowSchema>;

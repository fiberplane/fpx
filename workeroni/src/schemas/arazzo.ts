import { z } from "zod";

// Simplified schema for workflows
export const workflowSchema = z
  .object({
    workflowId: z.string().describe("A unique identifier for the workflow. Example: create-user-workflow"),
    summary: z.string().describe("A short summary of what the workflow does. Example: Process new user registration"),
    description: z.string().describe("A detailed description of the workflow's purpose and steps"),
    steps: z.array(z.object({
      stepId: z.string().describe("A unique identifier for this step. Example: create-user"),
      description: z.string().describe("What this step does. Example: Create a new user account in the database"),
      operation: z.string().describe("The operationId from OpenAPI spec (e.g., createUser) or the path (e.g., /users/create)"),
      parameters: z.array(z.object({
        name: z.string().describe("Name of the parameter. Example: email"),
        value: z.string().describe("Value or reference. Example: $.inputs.userEmail")
      })).default([]).describe("Parameters needed for the operation")
    })).min(1).describe("The sequence of API operations to perform")
  })
  .strict();

// Type exports for TypeScript usage
export type Workflow = z.infer<typeof workflowSchema>;
export type WorkflowStep = Workflow["steps"][number];
export type Parameter = WorkflowStep["parameters"][number];

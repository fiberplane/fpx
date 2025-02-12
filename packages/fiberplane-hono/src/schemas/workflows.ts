// All copied from the Playground Services

import { z } from "zod";

// Core workflow step types
export const StepParameterSchema = z.object({
  name: z.string().describe("Name of the parameter. Example: email"),
  value: z
    .string()
    .describe(
      "Value or reference to input/previous step output. Example: $.inputs.userEmail",
    ),
});

export const StepSuccessCriteriaSchema = z.object({
  condition: z
    .string()
    .describe(
      "Success condition expression. Example: $response.statusCode === 200",
    ),
});

export const OutputSchema = z.object({
  key: z.string().describe("Output key name. Example: userId"),
  value: z
    .string()
    .describe("Path to value in response. Example: $response.body#/data/id"),
});

export const StepSchema = z.object({
  stepId: z
    .string()
    .describe("A unique identifier for this step. Example: create-user"),
  description: z
    .string()
    .describe(
      "What this step does. Example: Create a new user account in the database",
    ),
  operation: z
    .string()
    .describe(
      "The operationId from OpenAPI spec (e.g., createUser) or the path (e.g., /users/create)",
    ),
  parameters: z
    .array(StepParameterSchema)
    .default([])
    .describe("Parameters needed for the operation"),
  successCriteria: z
    .array(StepSuccessCriteriaSchema)
    .default([])
    .describe(
      "Conditions that must be met for the step to be considered successful",
    ),
  outputs: z
    .array(OutputSchema)
    .default([])
    .describe(
      "Values to extract from the response for use in subsequent steps",
    ),
});

// Core workflow types
export const WorkflowSchema = z.object({
  workflowId: z
    .string()
    .describe(
      "A unique identifier for the workflow. Example: loginUserAndCreateWorkflow",
    ),
  prompt: z
    .string()
    .describe(
      "Original user story/prompt. Example: Create a workflow that registers a new user",
    ),
  summary: z
    .string()
    .describe(
      "A very short summary of what the workflow does (acts as a name). Example: Process new user registration",
    ),
  description: z
    .string()
    .describe(
      "A detailed description of the workflow's purpose and steps. Example: Handles the complete user registration flow including account creation and welcome email",
    ),
  steps: z
    .array(StepSchema)
    .min(1)
    .describe("The sequence of API operations to perform"),
  inputs: z
    .object({
      type: z.enum([
        "string",
        "number",
        "integer",
        "boolean",
        "object",
        "array",
      ]),
      properties: z
        .record(z.string(), z.any())
        .describe("Properties of the input"),
      required: z
        .array(z.string())
        .describe("Required properties of the input"),
    })
    .describe("JSON Schema definition of overall workflow inputs"),
  outputs: z
    .array(OutputSchema)
    .default([])
    .describe("Final output values from the steps of the workflow"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// API request schemas
export const GenerateWorkflowRequestSchema = z.object({
  prompt: z.string(),
  openApiSchema: z.string(),
});

// Export types
export type StepParameter = z.infer<typeof StepParameterSchema>;
export type StepSuccessCriteria = z.infer<typeof StepSuccessCriteriaSchema>;
export type StepOutput = z.infer<typeof OutputSchema>;
export type Step = z.infer<typeof StepSchema>;
export type Workflow = z.infer<typeof WorkflowSchema>;
export type GenerateWorkflow = z.infer<typeof GenerateWorkflowRequestSchema>;

// Export workflow input/output types
export type WorkflowInputs = z.infer<typeof WorkflowSchema>["inputs"];
export type WorkflowOutputs = z.infer<typeof WorkflowSchema>["outputs"];
export type WorkflowHeader = Pick<
  Workflow,
  "workflowId" | "summary" | "description"
>;

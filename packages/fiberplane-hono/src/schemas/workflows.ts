// All copied from the service schema

import { z } from "zod";

// Core workflow step types
export const StepParameterSchema = z.object({
  name: z.string().describe("Name of the parameter. Example: email"),
  in: z
    .enum(["query", "path", "header", "cookie"])
    .describe("Where the parameter is located. Example: query"),
  value: z
    .string()
    .describe(
      "Value or reference to input/previous step output. Example: $.inputs.userEmail",
    ),
});

export const StepRequestBodySchema = z.object({
  contentType: z
    .enum([
      "application/json",
      "application/x-www-form-urlencoded",
      "multipart/form-data",
    ])
    .describe(
      "The MIME type of the body of the request. Example: application/json",
    ),
  payload: z.union([
    // JSON Object Example - direct object payload
    z.record(z.union([
      z.string(),
      z.number(),
      z.boolean(),
      z.null(),
      z.array(z.union([z.string(), z.number(), z.boolean(), z.null()])),
      z.record(z.union([z.string(), z.number(), z.boolean(), z.null()]))
    ])).describe("Direct JSON object payload"),
    
    // Complete Runtime Expression - string starting with $
    z.string().describe("Runtime expression reference"),
    
    // Form Data Example - record of primitive values
    z.record(z.union([
      z.string(),
      z.number(),
      z.boolean()
    ])).describe("Form data payload")
  ]).describe("The payload of the request. Can be a direct JSON object, runtime expression, or form data."),
  replacements: z
    .array(
      z.object({
        target: z
          .string()
          .describe(
            "The target of the replacement - JSON pointer to the value to replace. Example: /email",
          ),
        value: z
          .any()
          .describe(
            "The value to replace the target with. Example: test@example.com",
          ),
      }),
    )
    .describe(
      "Replacements to make to the payload. Example: [{ target: '/email', value: 'test@example.com' }]",
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
  operation: z.object({
    method: z.enum(["get", "post", "put", "delete", "patch", "head", "options", "trace"]).describe("The HTTP method to use for the operation. Example: post"),
    path: z.string().describe("The path to the operation. Example: /users"),
  }),
  parameters: z
    .array(StepParameterSchema)
    .default([])
    .describe("Parameters needed for the operation"),
  requestBody: StepRequestBodySchema.optional(),
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

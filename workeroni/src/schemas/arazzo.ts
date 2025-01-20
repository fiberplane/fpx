import { z } from "zod";

// Runtime Expression Schema
const runtimeExpressionSchema = z
  .string()
  .describe(
    "A runtime expression that can reference various parts of the request/response cycle and workflow execution state. Examples: $response.statusCode === 200, $response.body#/user/id, $steps.create-user.outputs.userId"
  );

// Info Object Schema
export const infoSchema = z
  .object({
    title: z.string().describe("The title of the API. Example: Pet Store API"),
    version: z.string().describe("The version of the API. Example: 1.0.0"),
  })
  .strict();

// Source Description Object Schema
export const sourceDescriptionSchema = z
  .object({
    name: z.string().describe("A unique name for the source. Example: petstore"),
    url: z.string().describe("The URL where the source can be accessed. Example: https://petstore.swagger.io/v2/swagger.json"),
    type: z.string().describe("The type of the source (e.g., 'openapi'). Example: openapi"),
  })
  .strict();

// Parameter Schema
export const parameterSchema = z
  .object({
    name: z.string(),
    in: z.enum(["query", "header", "path", "cookie"]).describe("Location of the parameter. Examples: 'path' for URL parameters, 'header' for HTTP headers"),
    value: z.string().describe("Runtime expression or literal value. Examples: $inputs.userId, $steps.previous.outputs.token, 'application/json'"),
  })
  .strict();

// Success Criteria Schema
export const successCriteriaSchema = z
  .object({
    condition: z.string().describe("Expression that must evaluate to true for success. Examples: $response.statusCode === 201, $response.body#/status === 'active', $response.header.content-type === 'application/json'"),
  })
  .strict();

// Core step schema
export const stepSchema = z
  .object({
    stepId: z.string(),
    description: z.string(),
    operationId: z.string().optional(),
    operationPath: z.string().optional(),
    parameters: z.array(parameterSchema).optional().default([]),
    successCriteria: z.array(successCriteriaSchema).optional().default([]),
    outputs: z.array(z.object({
      key: z.string().describe("Name for the captured output. Example: userId, authToken"),
      value: z.string().describe("Path to the value to capture. Examples: $response.body#/id, $response.header.authorization")
    }).strict()).optional().default([]),
  })
  .strict()
  .refine(
    data => data.operationId || data.operationPath,
    "Either operationId or operationPath must be provided"
  );

// Core workflow schema - simplified structure
export const workflowSchema = z
  .object({
    workflowId: z.string(),
    summary: z.string(),
    description: z.string(),
    steps: z.array(stepSchema).min(1),
    // Simplified inputs structure
    inputs: z.object({
      type: z.literal("object"),
      properties: z.array(z.object({
        key: z.string(),
        value: z.object({
          type: z.string(),
          description: z.string().optional()
        }).strict()
      }).strict()).optional().default([]),
      required: z.array(z.string()).optional().default([])
    }).optional(),
    // Optional outputs array
    outputs: z.array(z.object({
      key: z.string(),
      value: z.string()
    }).strict()).optional().default([])
  })
  .strict();

// Components Object Schema
export const componentsSchema = z
  .object({
    parameters: z.array(z.object({
      key: z.string(),
      value: parameterSchema
    }).strict()).optional(),
    schemas: z.array(z.object({
      key: z.string(),
      value: z.unknown()
    }).strict()).optional()
  })
  .strict();

// Root Arazzo Specification Object Schema
export const arazzoSpecificationSchema = z
  .object({
    arazzo: z.string().describe("The semantic version of the Arazzo specification. Example: 1.0.0"),
    info: infoSchema,
    sourceDescriptions: z.array(sourceDescriptionSchema).min(1),
    workflows: z.array(workflowSchema).min(1),
    components: componentsSchema.optional()
  })
  .strict();

// Simplified schema for LLM output
export const llmWorkflowSchema = z
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

// Simple conversion to full schema
export function convertLLMtoArazzoWorkflow(llmWorkflow: z.infer<typeof llmWorkflowSchema>): z.infer<typeof workflowSchema> {
  return {
    ...llmWorkflow,
    steps: llmWorkflow.steps.map(step => ({
      stepId: step.stepId,
      description: step.description,
      ...(step.operation.startsWith('/') 
        ? { operationPath: step.operation }
        : { operationId: step.operation }),
      parameters: step.parameters.map(p => ({
        name: p.name,
        in: 'path',
        value: p.value
      })),
      successCriteria: [],
      outputs: []
    })),
    outputs: []
  };
}

// Type exports for TypeScript usage
export type ArazzoSpecification = z.infer<typeof arazzoSpecificationSchema>;
export type Workflow = z.infer<typeof workflowSchema>;
export type Step = z.infer<typeof stepSchema>;
export type SourceDescription = z.infer<typeof sourceDescriptionSchema>;
export type Parameter = z.infer<typeof parameterSchema>;
export type SuccessCriteria = z.infer<typeof successCriteriaSchema>;
export type Components = z.infer<typeof componentsSchema>;
export type Info = z.infer<typeof infoSchema>;
// Add new LLM types
export type LLMWorkflow = z.infer<typeof llmWorkflowSchema>;

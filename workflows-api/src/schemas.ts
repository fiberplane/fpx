import { z } from "zod";

// Runtime Expression Schema
const runtimeExpressionSchema = z.string().regex(/^\$(?:url|method|statusCode|request\.|response\.|message\.|inputs\.|outputs\.|steps\.|workflows\.|sourceDescriptions\.|components\.)/);

// Info Object Schema
export const infoSchema = z.object({
  title: z.string(),
  summary: z.string().optional(),
  description: z.string().optional(),
  version: z.string(),
}).catchall(z.any()); // For x- extensions

// Source Description Object Schema
export const sourceDescriptionSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  type: z.string(), // e.g., "openapi"
}).catchall(z.any());

// Parameter Object Schema
export const parameterSchema = z.object({
  name: z.string(),
  in: z.enum(["query", "header", "path", "cookie"]),
  value: z.union([z.string(), runtimeExpressionSchema]),
}).catchall(z.any());

// Success Criteria Object Schema
export const successCriteriaSchema = z.object({
  condition: runtimeExpressionSchema,
}).catchall(z.any());

// Payload Replacement Object Schema
export const payloadReplacementSchema = z.object({
  target: z.string(), // JSON Pointer or XPath Expression
  value: z.union([z.any(), runtimeExpressionSchema]),
}).catchall(z.any());

// Step Object Schema
export const stepSchema = z.object({
  stepId: z.string(),
  description: z.string().optional(),
  operationId: z.string().optional(),
  operationPath: z.string().optional(),
  parameters: z.array(parameterSchema).optional(),
  successCriteria: z.array(successCriteriaSchema).optional(),
  outputs: z.record(z.union([z.string(), runtimeExpressionSchema])).optional(),
}).catchall(z.any());

// Workflow Object Schema
export const workflowSchema = z.object({
  workflowId: z.string(),
  summary: z.string().optional(),
  description: z.string().optional(),
  inputs: z.object({
    type: z.literal("object"),
    properties: z.record(z.object({
      type: z.string(),
      description: z.string().optional(),
    })),
    required: z.array(z.string()).optional(),
  }).optional(),
  steps: z.array(stepSchema),
  outputs: z.record(z.union([z.string(), runtimeExpressionSchema])).optional(),
}).catchall(z.any());

// Components Object Schema
export const componentsSchema = z.object({
  parameters: z.record(parameterSchema).optional(),
  schemas: z.record(z.any()).optional(),
}).catchall(z.any());

// Root Arazzo Specification Object Schema
export const arazzoSpecificationSchema = z.object({
  arazzo: z.string().regex(/^\d+\.\d+\.\d+$/), // Semantic version format
  info: infoSchema,
  sourceDescriptions: z.array(sourceDescriptionSchema).min(1),
  workflows: z.array(workflowSchema).min(1),
  components: componentsSchema.optional(),
}).catchall(z.any()); // For x- extensions

// Type exports for TypeScript usage
export type ArazzoSpecification = z.infer<typeof arazzoSpecificationSchema>;
export type Workflow = z.infer<typeof workflowSchema>;
export type Step = z.infer<typeof stepSchema>;
export type SourceDescription = z.infer<typeof sourceDescriptionSchema>;
export type Parameter = z.infer<typeof parameterSchema>;
export type SuccessCriteria = z.infer<typeof successCriteriaSchema>;
export type PayloadReplacement = z.infer<typeof payloadReplacementSchema>;
export type Components = z.infer<typeof componentsSchema>;
export type Info = z.infer<typeof infoSchema>;

import type { OtelEvent, OtelSpan, OtelTrace } from "@fiberplane/fpx-types";
import { z } from "zod";

export type PanelState = "open" | "closed";

export type Panels = {
  timeline: PanelState;
  aiTestGeneration: PanelState;
  logs: PanelState;
};

export const RequestMethodSchema = z.enum([
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "OPTIONS",
  "PATCH",
  "HEAD",
  "ALL",
]);

export type RequestMethod = z.infer<typeof RequestMethodSchema>;

export const isRequestMethod = (method: unknown): method is RequestMethod => {
  return RequestMethodSchema.safeParse(method).success;
};

export const RequestMethodInputValueSchema = z.union([
  RequestMethodSchema,
  z.literal("WS"),
]);
export type RequestMethodInputValue = z.infer<
  typeof RequestMethodInputValueSchema
>;

export const RequestTypeSchema = z.enum(["http", "websocket"]);
export type RequestType = z.infer<typeof RequestTypeSchema>;

export const ProbedRouteSchema = z.object({
  id: z.number(),
  path: z.string(),
  method: RequestMethodSchema,
  handler: z.string(),
  handlerType: z.enum(["route", "middleware"]),
  currentlyRegistered: z.boolean(),
  registrationOrder: z.number().default(-1),
  routeOrigin: z.enum(["discovered", "custom", "open_api"]),
  openApiSpec: z.string().nullish().optional(),
  requestType: RequestTypeSchema,
  // NOTE - Added on the frontend, not stored in DB
  isDraft: z
    .boolean()
    .optional()
    .describe(
      "Added on the frontend, not stored in DB. This is only true when the user is typing a path, and none of the routes in the sidebar match.",
    ),
});

export type ProbedRoute = z.infer<typeof ProbedRouteSchema>;

export interface Parameter {
  name: string;
  value: string;
}

export interface SuccessCriteria {
  condition: string;
}

export interface Output {
  key: string;
  value: string;
}

export interface WorkflowStep {
  stepId: string;
  description: string;
  operation: string;
  parameters: Parameter[];
  successCriteria: SuccessCriteria[];
  outputs: Output[];
}

export interface Workflow {
  workflowId: string;
  prompt: string;
  summary: string;
  description: string;
  steps: WorkflowStep[];
  inputs: JSONSchema;
  outputs: Output[];
  createdAt: Date;
  updatedAt: Date;
}

export interface JSONSchema {
  type: "object";
  properties: {
    [key: string]: {
      type: "string" | "number" | "integer" | "boolean" | "object" | "array";
      description: string;
      title?: string;
      default?: unknown;
      examples?: unknown[];
      items?: JSONSchema; // For array types
      properties?: {
        // For object types
        [key: string]: JSONSchema;
      };
      required?: string[];
      [key: string]: unknown; // For other valid JSON Schema properties
    };
  };
  required?: string[];
  additionalProperties?: boolean;
}

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: {
    message: string;
    code?: string;
  };
}

// Re-export the OpenTelemetry types
export type { OtelSpan as Span, OtelTrace as Trace, OtelEvent };

// Remove the old Span and Trace interfaces since we're using the ones from @fiberplane/types

/**
 * This is a temporary type/schema that supports the MizuOrphanLog type,
 * which is used to display logs in the Traces page.
 */

const CallerLocationSchema = z.object({
  file: z.string().nullish(),
  line: z.number().nullish(),
  column: z.number().nullish(),
  methodName: z.string().nullish(),
  arguments: z.array(z.string()).nullish(),
});

export type CallerLocation = z.infer<typeof CallerLocationSchema>;

const MizuOrphanLogSchema = z.object({
  id: z.number(),
  traceId: z.string(),
  isException: z.boolean().nullish(),
  timestamp: z.coerce.date(),
  level: z.string(), // TODO - use enum from db schema?
  message: z.union([z.string(), z.null()]),
  args: z.array(z.unknown()), // NOTE - arguments passed to console.*
  callerLocations: z.array(CallerLocationSchema).nullish(),
  ignored: z.boolean().nullish(),
  service: z.string().nullish(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  relatedSpanId: z.string().nullish(),
});

export type MizuOrphanLog = z.infer<typeof MizuOrphanLogSchema>;

export const isMizuOrphanLog = (log: unknown): log is MizuOrphanLog => {
  return MizuOrphanLogSchema.safeParse(log).success;
};

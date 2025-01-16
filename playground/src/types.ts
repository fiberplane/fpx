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

export interface Step {
  stepId: string;
  description: string;
  operationId?: string;
  operationPath?: string;
  parameters?: Array<{
    name: string;
    in: "query" | "header" | "path" | "cookie";
    value: string;
  }>;
  successCriteria?: Array<{
    condition: string;
  }>;
  outputs?: Record<string, string>;
}

export interface OAISchema {
  id: string;
  name: string;
  content: string;
}

export interface Workflow {
  id: string;
  name: string;
  prompt: string;
  oaiSchemaId: string;
  summary?: string;
  description?: string;
  arazzoSchema?: string;
  steps: Step[];
  lastRunStatus?: "success" | "pending" | "error";
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    message: string;
    code?: string;
  };
}

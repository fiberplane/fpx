import { z } from "zod";
import { WEBSOCKETS_ENABLED } from "./webSocketFeatureFlag";

export const RequestMethodSchema = z.enum([
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "OPTIONS",
  "PATCH",
  "HEAD",
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

export const isWsRequest = (requestType: RequestType) =>
  WEBSOCKETS_ENABLED && requestType === "websocket";

export const ProbedRouteSchema = z.object({
  path: z.string(),
  method: RequestMethodSchema,
  handler: z.string(),
  handlerType: z.enum(["route", "middleware"]),
  currentlyRegistered: z.boolean(),
  registrationOrder: z.number().default(-1),
  routeOrigin: z.enum(["discovered", "custom", "open_api"]),
  openApiSpec: z.string().optional(),
  requestType: RequestTypeSchema,
  // NOTE - Added on the frontend, not stored in DB
  isDraft: z.boolean().optional(),
});

export type ProbedRoute = z.infer<typeof ProbedRouteSchema>;

import { z } from "zod";

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
  requestType === "websocket";

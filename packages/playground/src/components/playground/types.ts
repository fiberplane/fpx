import type {
  SupportedOperationObject,
  SupportedParameterObject,
} from "@/lib/isOpenApi";
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
  "TRACE",
]);

export type RequestMethod = z.infer<typeof RequestMethodSchema>;

export const isRequestMethod = (method: unknown): method is RequestMethod => {
  return RequestMethodSchema.safeParse(method).success;
};

export type ApiRoute = {
  path: string;
  method: RequestMethod;
  parameters?: Array<SupportedParameterObject>;
  operation: SupportedOperationObject;
};

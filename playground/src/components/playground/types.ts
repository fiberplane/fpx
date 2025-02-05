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

export const ApiRouteSchema = z.object({
  id: z.number(),
  path: z.string(),
  method: RequestMethodSchema,
  openApiSpec: z.string().nullish().optional(),
  title: z.string().nullish(),
  summary: z.string().nullish(),
  description: z.string().nullish(),
  tags: z.array(z.string()).nullish(),
});

export type ApiRoute = z.infer<typeof ApiRouteSchema>;

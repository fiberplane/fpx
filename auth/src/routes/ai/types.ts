import { z } from "zod";

export const GenerateRequestOptionsSchema = z.object({
  persona: z.string(),
  method: z.string(),
  path: z.string(),
  handler: z.string(),
  handlerContext: z.string().optional(),
  history: z.array(z.string()).optional(),
  openApiSpec: z.string().optional(),
  middleware: z
    .array(
      z.object({
        handler: z.string(),
        method: z.string(),
        path: z.string(),
      }),
    )
    .optional(),
  middlewareContext: z.string().optional(),
});

export type GenerateRequestOptions = z.infer<
  typeof GenerateRequestOptionsSchema
>;

// ... rest of the existing code ...

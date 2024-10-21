import { z } from "zod";

export const SchemaContextSchema = z.object({
  type: z.string(),
  drizzleImport: z.string(),
  vendor: z.string(),
});

export type SchemaContext = z.infer<typeof SchemaContextSchema>;

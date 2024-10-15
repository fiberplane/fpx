import { z } from "zod";

export const scaffoldAppToolParametersSchema = z
  .object({
    indexFile: z.string(),
    schemaFile: z.string(),
    seedFile: z.string(),
  })
  .describe("The parameters for the scaffold_app tool");

export const isScaffoldAppToolParameters = (
  params: unknown,
): params is z.infer<typeof scaffoldAppToolParametersSchema> => {
  return scaffoldAppToolParametersSchema.safeParse(params).success;
};

export const scaffoldAppTool = {
  type: "function",
  function: {
    name: "scaffold_app",
    description: "Scaffolds a Hono API based on a prompt",
    parameters: {
      type: "object",
      properties: {
        indexFile: {
          type: "string",
        },
        schemaFile: {
          type: "string",
        },
        seedFile: {
          type: "string",
        },
      },
      required: ["indexFile", "schemaFile", "seedFile"],
    },
  },
} as const;

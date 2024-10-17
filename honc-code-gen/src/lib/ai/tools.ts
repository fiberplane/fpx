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
    description: "Returns modified Hono API files based on a user prompt",
    parameters: {
      type: "object",
      properties: {
        reasoning: {
          type: "string",
          description: "The brief reasoning for the changes to the files",
        },
        schemaFile: {
          type: "string",
          description: "The modified src/db/schema.ts file",
        },
        indexFile: {
          type: "string",
          description: "The modified src/index.ts file",
        },
        seedFile: {
          type: "string",
          description: "The modified seed.ts file",
        },
      },
      required: ["indexFile", "schemaFile", "seedFile"],
    },
  },
} as const;

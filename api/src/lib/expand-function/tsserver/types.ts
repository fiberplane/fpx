import { z } from "zod";

const PositionSchema = z.object({
  line: z.number(),
  character: z.number(),
});

const RangeSchema = z.object({
  start: PositionSchema,
  end: PositionSchema,
});

const DefinitionSchema = z.object({
  uri: z.string().url(),
  range: RangeSchema,
});

export const DefinitionsArraySchema = z.array(DefinitionSchema);

/**
 * Expected response from:
 * - `textDocument/definition`
 * - `workspace/executeCommand` of `_typescript.goToSourceDefinition`
 */
export type DefinitionsArray = z.infer<typeof DefinitionsArraySchema>;

/**
 * A definition description returned from tsserver
 */
export type Definition = z.infer<typeof DefinitionSchema>;

/**
 * Type guard for DefinitionsArray (see `DefinitionsArraySchema`)
 */
export function isDefinitionsArray(data: unknown): data is DefinitionsArray {
  return DefinitionsArraySchema.safeParse(data).success;
}

// Define the Zod schema for the diagnostics response
const DiagnosticSchema = z.object({
  severity: z.number().optional(),
  message: z.string(),
  range: z.object({
    start: z.object({
      line: z.number(),
      character: z.number(),
    }),
    end: z.object({
      line: z.number(),
      character: z.number(),
    }),
  }),
  source: z.string().optional(),
  code: z.union([z.string(), z.number()]).optional(),
});

const PublishDiagnosticsParamsSchema = z.object({
  uri: z.string(),
  diagnostics: z.array(DiagnosticSchema),
});

/**
 * Expected response from:
 * - `textDocument/publishDiagnostics`
 */
export type PublishDiagnosticsParams = z.infer<
  typeof PublishDiagnosticsParamsSchema
>;

export const isPublishDiagnosticsParams = (
  data: unknown,
): data is PublishDiagnosticsParams => {
  return PublishDiagnosticsParamsSchema.safeParse(data).success;
};

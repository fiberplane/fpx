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

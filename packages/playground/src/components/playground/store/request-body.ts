import { z } from "zod";
import { FormDataParameterSchema } from "../FormDataForm";

const PlaygroundBodyJsonTypeSchema = z.literal("json");
const PlaygroundBodyTextTypeSchema = z.literal("text");
const PlaygroundBodyFormDataTypeSchema = z.literal("form-data");
const PlaygroundBodyFileTypeSchema = z.literal("file");

const PlaygroundBodyTypeSchema = z.union([
  PlaygroundBodyJsonTypeSchema,
  PlaygroundBodyTextTypeSchema,
  PlaygroundBodyFormDataTypeSchema,
  PlaygroundBodyFileTypeSchema,
]);

/**
 * The identifying value for the discriminator `type` property on the PlaygroundBody (schema) types
 */
export type PlaygroundBodyType = z.infer<typeof PlaygroundBodyTypeSchema>;

export const isPlaygroundBodyType = (
  bodyType: unknown,
): bodyType is PlaygroundBodyType =>
  PlaygroundBodyTypeSchema.safeParse(bodyType).success;

export const PlaygroundBodySchema = z.union([
  z.object({
    type: PlaygroundBodyTextTypeSchema,
    value: z.string().optional(),
  }),
  z.object({
    type: PlaygroundBodyJsonTypeSchema,
    value: z.string().optional(),
  }),
  z.object({
    type: PlaygroundBodyFormDataTypeSchema,
    isMultipart: z.boolean(),
    value: z.array(FormDataParameterSchema),
  }),
  z.object({
    type: PlaygroundBodyFileTypeSchema,
    value: z.instanceof(File).optional(),
  }),
]);

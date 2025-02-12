import { z } from "zod";

export type KeyColor = "text-orange-500" | "text-blue-500";

export const FormDataParameterSchema = z.object({
  id: z.string(),
  key: z.string(),
  value: z.union([
    z.object({
      type: z.literal("text"),
      value: z.string(),
    }),
    z.object({
      type: z.literal("file"),
      name: z.string(),
      value: z.instanceof(File),
    }),
  ]),
  enabled: z.boolean(),
});

/**
 * A "key-value parameter" is a record containing `key` and `value` properties.
 * It can be used to represent things like query parameters or headers.
 */
export type FormDataParameter = z.infer<typeof FormDataParameterSchema>;

/**
 * A "draft parameter" is a disabled parameter with a blank key and value.
 * In practice, it is a special case of {@link FormDataParameter},
 * and it is used to represent a new parameter that has not yet been added to the list.
 */
export type DraftFormDataParameter = FormDataParameter & {
  key: "";
  value: {
    type: "text";
    value: "";
  };
  enabled: false;
};

export type ChangeFormDataParametersHandler = (
  newFormDataParameters: FormDataParameter[],
) => void;

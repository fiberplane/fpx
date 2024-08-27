import { z } from "zod";

export type KeyColor = "text-orange-500" | "text-blue-500";

export const KeyValueParameterSchema = z.object({
  id: z.string(),
  key: z.string(),
  value: z.string(),
  enabled: z.boolean(),
});

/**
 * A "key-value parameter" is a record containing `key` and `value` properties.
 * It can be used to represent things like query parameters or headers.
 */
export type KeyValueParameter = z.infer<typeof KeyValueParameterSchema>;

/**
 * A "draft parameter" is a disabled parameter with a blank key and value.
 * In practice, it is a special case of {@link KeyValueParameter},
 * and it is used to represent a new parameter that has not yet been added to the list.
 */
export type DraftKeyValueParameter = KeyValueParameter & {
  key: "";
  value: "";
  enabled: false;
};

export type ChangeKeyValueParametersHandler = (
  newQueryParams: KeyValueParameter[],
) => void;

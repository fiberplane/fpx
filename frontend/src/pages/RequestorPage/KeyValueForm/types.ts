export type KeyColor = "text-orange-500" | "text-blue-500";

/**
 * A "key-value parameter" is a record containing `key` and `value` properties.
 * It can be used to represent things like query parameters or headers.
 */
export type KeyValueParameter = {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
};

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
  newQueryParams: KeyValueParameter[]
) => void;
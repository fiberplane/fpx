import type { KeyValueParameter } from "../store";

export type KeyColor = "text-primary" | "text-info";

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

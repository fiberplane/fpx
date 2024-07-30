import { useMemo, useState } from "react";

import { createParameterId, isDraftParameter } from "./data";
import type { DraftKeyValueParameter, KeyValueParameter } from "./types";

const INITIAL_KEY_VALUE_PARAMETER: KeyValueParameter = {
  id: createParameterId(),
  key: "",
  value: "",
  enabled: false,
};

export const useKeyValueForm = (initial?: KeyValueParameter[]) => {
  const [_keyValueParameters, setKeyValueParameters] = useState<
    KeyValueParameter[]
  >(
    initial ?? [
      {
        ...INITIAL_KEY_VALUE_PARAMETER,
      },
    ],
  );

  const { parameters: keyValueParameters } =
    useKeyValueParameters(_keyValueParameters);

  return {
    keyValueParameters,
    setKeyValueParameters,
  };
};

/**
 * Hook that manages the state of a key-value form, ensuring that there is always a single
 * {@link DraftKeyValueParameter} at the end of the array of parameters.
 *
 * This allows us to treat the terminal parameter like a form element for new parameters.
 */
export function useKeyValueParameters(parameters: KeyValueParameter[]) {
  const parametersWithDraft = useMemo(
    () => enforceTerminalDraftParameter(parameters.map(disableBlankParameter)),
    [parameters],
  );

  return { parameters: parametersWithDraft };
}

/**
 * Immutably disable a {@link KeyValueParameter} if it has a blank key and value.
 */
const disableBlankParameter = (parameter: KeyValueParameter) => {
  if (parameter.key === "" && parameter.value === "") {
    return { ...parameter, enabled: false };
  }

  return parameter;
};

/**
 * NOTE - We're using this instead of enforceSingleTerminalDraftParameter
 *        in order to preserve focus on the last parameter when you delete all of a key.
 *        (Hard to explain, just know this is preferable to `enforceSingleTerminalDraftParameter` for UI behavior.)
 *
 * If the final element of the array is a {@link DraftKeyValueParameter}, return the array
 * Otherwise, return the array with a new draft parameter appended.
 *
 */
export const enforceTerminalDraftParameter = (
  parameters: KeyValueParameter[],
) => {
  const finalElement = parameters[parameters.length - 1];
  const hasTerminalDraftParameter = finalElement
    ? isDraftParameter(finalElement)
    : false;
  if (hasTerminalDraftParameter) {
    return parameters;
  }

  return concatDraftParameter(parameters);
};

/**
 * NOTE - This is the desired behavior, but does not play nicely with focus in the UI.
 *
 * If the final element of the array is a {@link DraftKeyValueParameter}, return the array
 * Otherwise, return the array with a new draft parameter appended.
 *
 * If there are multiple draft parameters, all will be filtered out, and a new draft parameter will be appended at the end.
 */
export const enforceSingleTerminalDraftParameter = (
  parameters: KeyValueParameter[],
) => {
  const firstDraftParameterIndex = parameters.findIndex(isDraftParameter);

  const hasSingleTeriminalDraftParameter =
    firstDraftParameterIndex + 1 === parameters.length;

  if (hasSingleTeriminalDraftParameter) {
    return parameters;
  }

  if (firstDraftParameterIndex === -1) {
    return concatDraftParameter(parameters);
  }

  const nonDraftParameters = parameters.filter((p) => !isDraftParameter(p));
  return concatDraftParameter(nonDraftParameters);
};

/**
 * Helper to immutabily add a {@link DraftKeyValueParameter} to the end of an array.
 */
const concatDraftParameter = (parameters: KeyValueParameter[]) => {
  const DRAFT_PARAMETER: DraftKeyValueParameter = {
    id: createParameterId(),
    enabled: false,
    key: "",
    value: "",
  };
  return [...parameters, DRAFT_PARAMETER];
};

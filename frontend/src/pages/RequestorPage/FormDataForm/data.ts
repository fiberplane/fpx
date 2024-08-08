import {
  ChangeFormDataParametersHandler,
  DraftFormDataParameter,
  FormDataParameter,
} from "./types";

export const createParameterId = () => generateUUID();

export const initializeKeyValueFormData = (): DraftFormDataParameter[] => {
  return [];
};

/**
 * Type guard to determine if a {@link FormDataParameter} is a {@link DraftFormDataParameter}.
 */
export const isDraftParameter = (
  parameter: FormDataParameter,
): parameter is DraftFormDataParameter => {
  return (
    parameter.enabled === false &&
    parameter.key === "" &&
    parameter.value.type === "text" &&
    parameter.value.value === ""
  );
};

/**
 * Count the number of non-draft parameters in a {@link FormDataParameter} list.
 */
export const countParameters = (parameters: FormDataParameter[]): number => {
  return parameters.reduce((count, parameter) => {
    if (isDraftParameter(parameter)) {
      return count;
    }

    return count + 1;
  }, 0);
};

/**
 * Return a function to immutably update an element of a {@link FormDataParameter} list with a new `enabled` property.
 */
export function createChangeEnabled(
  onChange: ChangeFormDataParametersHandler,
  allParameters: FormDataParameter[],
  parameter: FormDataParameter,
) {
  return modifyFormDataParameter(
    onChange,
    allParameters,
    parameter,
    (parameterToModify, enabled: boolean) => {
      return {
        ...parameterToModify,
        enabled,
      };
    },
  );
}

/**
 * Return a function to immutably update an element of a {@link FormDataParameter[]} with a new `key` property.
 */
export function createChangeKey(
  onChange: ChangeFormDataParametersHandler,
  allParameters: FormDataParameter[],
  parameter: FormDataParameter,
) {
  return modifyFormDataParameter(
    onChange,
    allParameters,
    parameter,
    (parameterToModify, newKey: string) => {
      return {
        ...parameterToModify,
        key: newKey,
      };
    },
  );
}

/**
 * Return a function to immutably update an element of a {@link FormDataParameter[]} with a new `value` property.
 */
export function createChangeValue(
  onChange: ChangeFormDataParametersHandler,
  allParameters: FormDataParameter[],
  parameter: FormDataParameter,
) {
  return modifyFormDataParameter(
    onChange,
    allParameters,
    parameter,
    (parameterToModify, newValue: FormDataParameter["value"]) => {
      return {
        ...parameterToModify,
        value: newValue,
      };
    },
  );
}

// Utils

/**
 * Helper to create a function that immutably updates an element of a {@link FormDataParameter[]} with a new property,
 * then calls a callback with the new array.
 */
function modifyFormDataParameter<T>(
  onChange: ChangeFormDataParametersHandler,
  allParameters: FormDataParameter[],
  parameter: FormDataParameter,
  mapNewValue: (p: FormDataParameter, newValue: T) => FormDataParameter,
) {
  return (newValue: T) => {
    const newQueryParams = allParameters.map((otherParameter) => {
      if (parameter.id === otherParameter.id) {
        const newParameter = mapNewValue(parameter, newValue);

        // When we change from draft to not draft, we want to enable the parameter
        if (isDraftParameter(parameter) && !isDraftParameter(newParameter)) {
          newParameter.enabled = true;
        }

        return newParameter;
      }

      return otherParameter;
    });
    onChange(newQueryParams);
  };
}

/**
 * Quick and dirty uuid utility
 */
function generateUUID() {
  const timeStamp = new Date().getTime().toString(36);
  const randomPart = () => Math.random().toString(36).substring(2, 15);
  return `${timeStamp}-${randomPart()}-${randomPart()}`;
}

export function reduceFormDataParameters(parameters: FormDataParameter[]) {
  return parameters.reduce((o, param) => {
    if (isDraftParameter(param)) {
      return o;
    }
    const { key, value, enabled } = param;
    if (!enabled) {
      return o;
    }
    if (value.type === "text") {
      o.append(key, value.value);
    } else {
      o.append(key, value.value, value.name);
    }
    return o;
  }, new FormData());
}

/**
 * NOTE - We're using this instead of enforceSingleTerminalDraftParameter
 *        in order to preserve focus on the last parameter when you delete all of a key.
 *        (Hard to explain, just know this is preferable to `enforceSingleTerminalDraftParameter` for UI behavior.)
 *
 * If the final element of the array is a {@link DraftFormDataParameter}, return the array
 * Otherwise, return the array with a new draft parameter appended.
 *
 */
export const enforceTerminalDraftParameter = (
  parameters: FormDataParameter[],
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
 * If the final element of the array is a {@link DraftFormDataParameter}, return the array
 * Otherwise, return the array with a new draft parameter appended.
 *
 * If there are multiple draft parameters, all will be filtered out, and a new draft parameter will be appended at the end.
 */
export const enforceSingleTerminalDraftParameter = (
  parameters: FormDataParameter[],
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
 * Helper to immutabily add a {@link DraftFormDataParameter} to the end of an array.
 */
const concatDraftParameter = (parameters: FormDataParameter[]) => {
  const DRAFT_PARAMETER: DraftFormDataParameter = {
    id: createParameterId(),
    enabled: false,
    key: "",
    value: {
      type: "text",
      value: "",
    },
  };
  return [...parameters, DRAFT_PARAMETER];
};

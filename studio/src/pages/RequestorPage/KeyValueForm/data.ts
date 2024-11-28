import type {
  ChangeKeyValueParametersHandler,
  DraftKeyValueParameter,
  KeyValueParameter,
} from "./types";

export const createParameterId = () => generateUUID();

export const initializeKeyValueFormData = (): DraftKeyValueParameter[] => {
  return [];
};

/**
 * Type guard to determine if a {@link KeyValueParameter} is a {@link DraftKeyValueParameter}.
 */
export const isDraftParameter = (
  parameter: KeyValueParameter,
): parameter is DraftKeyValueParameter => {
  return (
    parameter.enabled === false &&
    parameter.key === "" &&
    parameter.value === ""
  );
};

/**
 * Count the number of non-draft parameters in a {@link KeyValueParameter} list.
 */
export const countParameters = (parameters: KeyValueParameter[]): number => {
  return parameters.reduce((count, parameter) => {
    if (isDraftParameter(parameter)) {
      return count;
    }

    return count + 1;
  }, 0);
};

/**
 * Return a function to immutably update an element of a {@link KeyValueParameter} list with a new `enabled` property.
 */
export function createChangeEnabled(
  onChange: ChangeKeyValueParametersHandler,
  allParameters: KeyValueParameter[],
  parameter: KeyValueParameter,
) {
  return modifyKeyValueParameter(
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
 * Return a function to immutably update an element of a {@link KeyValueParameter[]} with a new `key` property.
 */
export function createChangeKey(
  onChange: ChangeKeyValueParametersHandler,
  allParameters: KeyValueParameter[],
  parameter: KeyValueParameter,
) {
  return modifyKeyValueParameter(
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
 * Return a function to immutably update an element of a {@link KeyValueParameter[]} with a new `value` property.
 */
export function createChangeValue(
  onChange: ChangeKeyValueParametersHandler,
  allParameters: KeyValueParameter[],
  parameter: KeyValueParameter,
) {
  return modifyKeyValueParameter(
    onChange,
    allParameters,
    parameter,
    (parameterToModify, newValue: string) => {
      return {
        ...parameterToModify,
        value: newValue,
      };
    },
  );
}

// Utils

/**
 * Helper to create a function that immutably updates an element of a {@link KeyValueParameter[]} with a new property,
 * then calls a callback with the new array.
 */
function modifyKeyValueParameter<T>(
  onChange: ChangeKeyValueParametersHandler,
  allParameters: KeyValueParameter[],
  parameter: KeyValueParameter,
  mapNewValue: (p: KeyValueParameter, newValue: T) => KeyValueParameter,
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

export function reduceKeyValueParameters(parameters: KeyValueParameter[]) {
  return parameters.reduce(
    (o, param) => {
      if (isDraftParameter(param)) {
        return o;
      }
      const { key, value, enabled } = param;
      if (!enabled) {
        return o;
      }
      o[key] = value;
      return o;
    },
    {} as Record<string, string>,
  );
}

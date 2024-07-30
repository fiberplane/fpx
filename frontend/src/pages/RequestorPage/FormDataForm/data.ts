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

export function createFormDataParameters(
  replacements: Array<{ key: string; value: FormDataParameter["value"] }>,
) {
  return replacements.map(({ key, value }) => {
    return {
      id: createParameterId(),
      key,
      value,
      enabled: true,
    };
  });
}

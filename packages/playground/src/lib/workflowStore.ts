import { create } from "zustand";
import type { ExecuteStepResult } from "./hooks/useWorkflows";

// Helper function to get nested value from an object using a path string
function getValueByPath(obj: unknown, path: string): unknown {
  if (Array.isArray(obj) && path.startsWith("[")) {
    const index = Number.parseInt(path.match(/\[(\d+)\]/)?.[1] || "", 10);
    const reconstructedPath = `[${index}]`;

    if (path === reconstructedPath) {
      return obj[index];
    }

    let newPath = path.replace(`${reconstructedPath}`, "");
    if (newPath.startsWith(".")) {
      newPath = newPath.substring(1);
    }
    return getValueByPath(obj[index], newPath);
  }

  if (!obj || typeof obj !== "object") {
    return undefined;
  }

  const parts = path.split(".");
  let current = obj as Record<string, unknown>;

  for (const part of parts) {
    if (!current || typeof current !== "object") {
      return undefined;
    }

    // Handle array indexing
    const match = part.match(/^(\w+)(?:\[(\d+)\])?$/);
    if (!match) {
      return undefined;
    }

    const [_, key, index] = match;
    current = current[key] as Record<string, unknown>;

    if (index !== undefined) {
      if (!Array.isArray(current)) {
        return undefined;
      }
      current = current[Number.parseInt(index, 10)] as Record<string, unknown>;
    }
  }

  return current;
}

export interface WorkflowStore {
  // Input values state
  inputValues: Record<string, string>;
  setInputValue: (key: string, value: string) => void;
  resetInputValues: () => void;

  // Output values state
  outputValues: Record<string, unknown>;
  setOutputValue: (key: string, value: unknown) => void;
  resetOutputValues: () => void;

  // Workflow Command state
  isWorkflowCommandOpen: boolean;
  setWorkflowCommandOpen: (open: boolean) => void;

  // Workflow state
  workflowState: Record<string, unknown>;
  setStepResult: (stepId: string, result: unknown) => void;
  resetWorkflowState: () => void;

  // Resolution helpers
  resolveRuntimeExpression: (expression: string) => unknown;
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => {
  return {
    // Input values state
    inputValues: {},
    setInputValue: (key, value) =>
      set(
        (state): WorkflowStore => ({
          ...state,
          inputValues: {
            ...state.inputValues,
            [key]: value,
          },
        }),
      ),
    resetInputValues: () => set((state) => ({ ...state, inputValues: {} })),

    // Output values state
    outputValues: {},
    setOutputValue: (key, value) =>
      set(
        (state): WorkflowStore => ({
          ...state,
          outputValues: {
            ...state.outputValues,
            [key]: value,
          },
        }),
      ),
    resetOutputValues: () => set((state) => ({ ...state, outputValues: {} })),

    // Workflow Command state
    isWorkflowCommandOpen: false,
    setWorkflowCommandOpen: (open) => () =>
      set((state) => ({
        ...state,
        isWorkflowCommandOpen: open,
      })),

    // Workflow state
    workflowState: {},
    setStepResult: (stepId, result) =>
      set((state) => ({
        ...state,
        workflowState: {
          ...state.workflowState,
          [stepId]: result,
        },
      })),
    resetWorkflowState: () => set((state) => ({ ...state, workflowState: {} })),

    // Resolution helpers
    resolveRuntimeExpression: (expression: string) => {
      const { inputValues, workflowState, outputValues } = get();

      if (expression.startsWith("$inputs.")) {
        const inputKey = expression.replace("$inputs.", "");
        return inputValues[inputKey] ?? expression;
      }

      if (expression.startsWith("$steps.")) {
        const stepId = expression.match(/^\$steps\.([^.]+)/)?.[1];
        if (!stepId) {
          return expression;
        }

        const stepResult = workflowState[snakeCaseToCamelCase(stepId)] as
          | ExecuteStepResult
          | undefined;
        if (!stepResult) {
          return expression;
        }

        // Get the path after stepId
        const path = expression.replace(/^\$steps\.[^.]+\./, "");
        if (path.startsWith("outputs.")) {
          // TODO: implement this nicely
          const firstPart = path
            .replace("outputs.", "")
            .split(".")[0]
            .split("[")[0];
          const simplestExpression = `$steps.${snakeCaseToCamelCase(stepId)}.outputs.${firstPart}`;
          if (simplestExpression in outputValues) {
            const value = outputValues[simplestExpression];
            if (simplestExpression === expression) {
              return value;
            }

            return (
              getValueByPath(
                value,
                expression.substring(
                  simplestExpression.length +
                    stepId.length -
                    snakeCaseToCamelCase(stepId).length,
                ),
              ) ?? expression
            );
          }
        }
        // For step results, we look in the data property
        return getValueByPath(stepResult, path) ?? expression;
      }

      if (expression.startsWith("$response.")) {
        // Extract type (body/headers) and path
        const [type, path] = expression.replace("$response.", "").split("#");

        // Find the most recent step result
        const currentStepId = Object.keys(workflowState).pop();
        if (!currentStepId) {
          return expression;
        }

        const stepResult = workflowState[currentStepId] as
          | ExecuteStepResult
          | undefined;
        if (!stepResult) {
          return expression;
        }

        // For body, look in the data property
        if (type === "body") {
          const dotPath = path?.replace(/^\//, "").replace(/\//g, ".") || "";
          return getValueByPath(stepResult.data, dotPath) ?? expression;
        }

        // For headers, just get the header directly
        if (type === "headers") {
          const headerName = path?.replace(/^\//, "") || "";
          return stepResult.headers?.[headerName] ?? expression;
        }

        return expression;
      }

      if (expression.startsWith("$outputs.")) {
        const outputKey = expression.replace("$outputs.", "");
        return outputValues[outputKey] ?? expression;
      }

      return expression;
    },
  };
});

// This is a temporary solution to solve some issues with snake_case and camelCase
function snakeCaseToCamelCase(str: string) {
  return str.replace(/([-_]\w)/g, (g) => g[1].toUpperCase());
}

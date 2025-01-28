import { create } from "zustand";
import type { ExecuteStepResult } from "./hooks/useWorkflows";

// Helper function to get nested value from an object using a path string
function getValueByPath(obj: unknown, path: string): unknown {
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
      set((state) => ({
        inputValues: {
          ...state.inputValues,
          [key]: value,
        },
      })),
    resetInputValues: () => set({ inputValues: {} }),

    // Output values state
    outputValues: {},
    setOutputValue: (key, value) =>
      set((state) => ({
        outputValues: {
          ...state.outputValues,
          [key]: value,
        },
      })),
    resetOutputValues: () => set({ outputValues: {} }),

    // Workflow Command state
    isWorkflowCommandOpen: false,
    setWorkflowCommandOpen: (open) => set({ isWorkflowCommandOpen: open }),

    // Workflow state
    workflowState: {},
    setStepResult: (stepId, result) =>
      set((state) => ({
        workflowState: {
          ...state.workflowState,
          [stepId]: result,
        },
      })),
    resetWorkflowState: () => set({ workflowState: {} }),

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

        const stepResult = workflowState[stepId] as ExecuteStepResult | undefined;
        if (!stepResult) {
          return expression;
        }

        // Get the path after stepId
        const path = expression.replace(/^\$steps\.[^.]+\./, '');
        
        // For step results, we look in the data property
        return getValueByPath(stepResult.data, path) ?? expression;
      }

      if (expression.startsWith("$response.")) {
        // Extract type (body/headers) and path
        const [type, path] = expression.replace("$response.", "").split("#");
        
        // Find the most recent step result
        const currentStepId = Object.keys(workflowState).pop();
        if (!currentStepId) {
          return expression;
        }

        const stepResult = workflowState[currentStepId] as ExecuteStepResult | undefined;
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

import { create } from "zustand";

export interface WorkflowStore {
  // Input values state
  inputValues: Record<string, string>;
  setInputValue: (key: string, value: string) => void;
  resetInputValues: () => void;

  // Workflow Command state
  isWorkflowCommandOpen: boolean;
  setWorkflowCommandOpen: (open: boolean) => void;

  // Resolution helpers
  resolveRuntimeExpression: (expression: string) => string;
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

    // Command state
    isWorkflowCommandOpen: false,
    setWorkflowCommandOpen: (open) => set({ isWorkflowCommandOpen: open }),

    // Resolution helpers
    resolveRuntimeExpression: (expression) => {
      const { inputValues } = get();
      if (!expression.startsWith("$inputs.")) {
        return expression;
      }
      const inputKey = expression.replace("$inputs.", "");
      return inputValues[inputKey] || expression;
    },
  };
});

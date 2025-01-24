import { create } from "zustand";

interface WorkflowStore {
  // Input values state
  inputValues: Record<string, string>;
  setInputValue: (key: string, value: string) => void;
  resetInputValues: () => void;

  // Resolution helpers
  resolveRuntimeExpression: (expression: string) => string;
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
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

  // Resolution helpers
  resolveRuntimeExpression: (expression) => {
    const { inputValues } = get();
    if (!expression.startsWith("$inputs.")) {
      return expression;
    }
    const inputKey = expression.replace("$inputs.", "");
    return inputValues[inputKey] || expression;
  },
}));

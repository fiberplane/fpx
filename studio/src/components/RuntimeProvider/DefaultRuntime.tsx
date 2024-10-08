import { RuntimeContext, type RuntimeProviderProps } from "./RuntimeProvider";

export function DefaultRuntime({ children }: RuntimeProviderProps) {
  return (
    <RuntimeContext.Provider value={{ type: "unknown" }}>
      {children}
    </RuntimeContext.Provider>
  );
}

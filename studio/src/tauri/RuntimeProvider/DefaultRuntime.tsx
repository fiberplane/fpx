import { RuntimeContext, type RuntimeProviderProps } from "./RuntimeProvider";

export function DefaultRuntime({ children }: RuntimeProviderProps) {
  const handleGetApiBaseUrl = () => "";

  return (
    <RuntimeContext.Provider
      value={{ type: "unknown", requestApiBaseUrl: handleGetApiBaseUrl }}
    >
      {children}
    </RuntimeContext.Provider>
  );
}

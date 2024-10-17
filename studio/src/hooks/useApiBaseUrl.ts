import { RuntimeContext } from "@/components/RuntimeProvider";
import { useContext } from "react";

export function useApiBaseUrl(): string {
  const runtime = useContext(RuntimeContext);

  if (runtime?.type === "tauri") {
    return runtime.requestApiBaseUrl();
  }

  return "";
}

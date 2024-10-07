import { RuntimeContext } from "@/tauri";
import { useContext } from "react";

export function useApiBaseUrl(): string {
  const runtime = useContext(RuntimeContext);
  return runtime?.requestApiBaseUrl() ?? "";
}

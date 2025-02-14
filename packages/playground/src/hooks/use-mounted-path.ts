import { parseEmbeddedConfig } from "@/utils/config-parser";

export function useMountedPath() {
  const rootElement = document.getElementById("root");
  if (!rootElement?.dataset.options) {
    return "";
  }

  const { mountedPath } = parseEmbeddedConfig(rootElement);
  return mountedPath;
}

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Context } from "./context";

/**
 * Touch a .dev.vars file and add the default FPX_ENDPOINT environment variable if not present.
 * @param context - The context object containing the project path.
 */
export function touchDevVars(context: Context): void {
  if (!context.path) {
    return;
  }

  try {
    const projectDir = existsSync(context.path) ? context.path : context.cwd;

    const devVarsPath = join(projectDir, ".dev.vars");

    let content = "";
    if (existsSync(devVarsPath)) {
      content = readFileSync(devVarsPath, "utf-8");
    }

    if (!content.includes("FPX_ENDPOINT=")) {
      const newLine = "FPX_ENDPOINT=http://localhost:8788/v1/traces\n";
      content += content.endsWith("\n") ? newLine : `\n${newLine}`;
      writeFileSync(devVarsPath, content);
    }
  } catch {
    // Fail silently
  }
}

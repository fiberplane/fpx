import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Context } from "./context";
import { getProjectName } from "./utils";

/**
 * Update the project name in the package.json and wrangler.toml files.
 * Update the project description in the package.json file.
 * @param context - The context object containing the project path.
 */
export function updateProjectName(context: Context): void {
  if (!context.path) {
    return;
  }

  const projectName = getProjectName(context.path);
  if (!projectName) {
    return;
  }

  const projectDir = join(context.cwd, context.path);

  // Update package.json
  const packageJsonPath = join(projectDir, "package.json");
  if (existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
      packageJson.name = projectName;
      if (context.description?.trim()) {
        packageJson.description = context.description?.trim();
      }
      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    } catch {
      // Fail silently
    }
  }

  // Update wrangler.toml
  const wranglerTomlPath = join(projectDir, "wrangler.toml");
  if (existsSync(wranglerTomlPath)) {
    try {
      let wranglerToml = readFileSync(wranglerTomlPath, "utf-8");
      wranglerToml = wranglerToml.replace(
        /^name = ".*"$/m,
        `name = "${projectName}"`,
      );
      writeFileSync(wranglerTomlPath, wranglerToml);
    } catch {
      // Fail silently
    }
  }
}

import logger from "../../../logger.js";

export function extractPackageName(uri: string): string | null {
  try {
    const url = new URL(uri);
    const path = decodeURIComponent(url.pathname); // Decode URI components

    const nodeModulesIndex = path.indexOf("node_modules");

    if (nodeModulesIndex === -1) {
      return null;
    }

    const packagePath = path.substring(
      nodeModulesIndex + "node_modules/".length,
    );

    // Handle pnpm structure
    const pnpmIndex = packagePath.indexOf(".pnpm/");
    if (pnpmIndex !== -1) {
      const pnpmPath = packagePath.substring(pnpmIndex + ".pnpm/".length);
      const parts = pnpmPath.split("/");

      // Handle scoped packages
      if (parts[0].startsWith("@") && parts.length > 1) {
        return `${parts[0]}/${parts[1]}`;
      }

      return parts[0];
    }

    const parts = packagePath.split("/");

    // Handle scoped packages
    if (parts[0].startsWith("@") && parts.length > 1) {
      return `${parts[0]}/${parts[1]}`;
    }

    return parts[0];
  } catch (error) {
    logger.error("[extractPackageName] Error parsing URI:", uri, error);
    return null;
  }
}

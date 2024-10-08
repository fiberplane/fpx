import path from "node:path";
import ts from "typescript";
import logger from "../../../logger.js";

/**
 * Resolves a module specifier to an absolute file path considering TypeScript path aliases.
 *
 * @param {string} moduleSpecifier - The module specifier from the import statement.
 * @param {string} containingFile - The absolute path of the file containing the import.
 * @param {string} projectRoot - The root directory of the project.
 * @returns {string | null} The resolved absolute file path or null if resolution fails.
 */
export function resolveModulePath(
  moduleSpecifier: string,
  containingFile: string,
  projectRoot: string,
): string | null {
  // Path to tsconfig.json
  const tsconfigPath = ts.findConfigFile(
    projectRoot,
    ts.sys.fileExists,
    "tsconfig.json",
  );

  if (!tsconfigPath) {
    logger.warn(
      `[resolveModulePath] tsconfig.json not found in project root: ${projectRoot}`,
    );
    return null;
  }

  // Parse tsconfig.json
  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  if (configFile.error) {
    logger.warn(
      "[resolveModulePath] Error reading tsconfig.json:",
      configFile.error.messageText,
    );
    return null;
  }

  const parsedConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(tsconfigPath),
  );

  if (parsedConfig.errors.length > 0) {
    logger.warn(
      "[resolveModulePath] Error parsing tsconfig.json:",
      parsedConfig.errors.map((e) => e.messageText).join(", "),
    );
    return null;
  }

  // Resolve the module name
  const resolvedModule = ts.resolveModuleName(
    moduleSpecifier,
    containingFile,
    parsedConfig.options,
    ts.sys,
  );

  if (resolvedModule.resolvedModule?.resolvedFileName) {
    return resolvedModule.resolvedModule.resolvedFileName;
  }

  logger.warn(
    `[resolveModulePath] Unable to resolve module: ${moduleSpecifier} from ${containingFile}`,
  );
  return null;
}

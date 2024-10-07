/**
 * NOTE - **NOT IN USE** currently, but this is a good starting point
 *        for creating a program from a typescript project in order to
 *        perform static analysis.
 *
 *        ...
 */

import * as path from "node:path";
import * as ts from "typescript";

/**
 * Create a program from a typescript project
 * in order to perform static analysis.
 *
   const program = getProgram('/path/to/your/project');
   const checker = program.getTypeChecker();
 *
 */
export function getProgram(pathToProject: string): ts.Program {
  const configPath = ts.findConfigFile(
    pathToProject,
    ts.sys.fileExists,
    "tsconfig.json",
  );
  if (!configPath) {
    throw new Error("Could not find a valid 'tsconfig.json'.");
  }

  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  if (configFile.error) {
    throw new Error("Error reading 'tsconfig.json'.");
  }

  const parsedCommandLine = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(configPath),
  );

  if (parsedCommandLine.errors.length > 0) {
    throw new Error("Error parsing 'tsconfig.json'.");
  }

  return ts.createProgram({
    rootNames: parsedCommandLine.fileNames,
    options: parsedCommandLine.options,
  });
}

// Usage

// Now you can perform various analyses using the TypeScript Compiler API

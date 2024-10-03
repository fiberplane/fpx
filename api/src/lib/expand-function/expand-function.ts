import fs from "node:fs";
import ts from "typescript";
import logger from "../../logger.js";
import {
  type OutOfScopeIdentifier,
  analyzeOutOfScopeIdentifiers,
  definitionToNode,
  getDefinitionText,
  getParentImportDeclaration,
} from "./ast-helpers/index.js";
import {
  contextForImport,
  extractPackageName,
  resolveModulePath,
} from "./imports/index.js";
import { searchFunction } from "./search-function/index.js";
import {
  getFileUri,
  getTSServer,
  getTextDocumentDefinition,
  getTsSourceDefinition,
  openFile,
} from "./tsserver/index.js";

type ExpandedFunctionContextEntry = {
  /** The name of the constant or utility in the code */
  name: string;
  /**
   * The type of the constant or utility.
   * This will be used to help determine whether or not to recursively comb
   * helper utilities to expand context of their utilities, etc.
   *
   * For now, "unknown" is a placeholder for other ast nodes we do not want to want to expand.
   */
  type: "unknown" | "function" | "type";
  /** The position of the constant or utility in the code */
  position: { line: number; character: number };
  definition?: {
    uri: string;
    range: {
      start: { line: number; character: number };
      end: { line: number; character: number };
    };
    /** The text of the definition (utility function, constant value, etc.) */
    text: string | undefined;
  };
  /** The package (in node_modules) that the constant or utility is defined in */
  package?: string;
  /**
   * Hurrah for recursive types!
   *
   * The child context of the constant or utility.
   * That is, if the constant or utility is a function,
   * this will contain definitions for any of the function's out-of-scope identifiers.
   */
  context?: ExpandedFunctionContext;
};

export type ExpandedFunctionContext = Array<ExpandedFunctionContextEntry>;

export type ExpandedFunctionResult = {
  /** The file in which the function was found */
  file: string;
  /** The line on which the function definition starts */
  startLine: number;
  /** The column on which the function definition starts */
  startColumn: number;
  /** The line on which the function definition ends */
  endLine: number;
  /** The column on which the function definition ends */
  endColumn: number;
  context: ExpandedFunctionContext;
};

type ExpandFunctionOptions = {
  skipSourceMap?: boolean;
  debug?: boolean;
  hints?: { sourceFunction?: string | null; sourceFile?: string | null };
};

/**
 * Expands the context of a specified function within the codebase by analyzing its out-of-scope identifiers
 * and recursively retrieving their definitions. This function searches for the target function, identifies
 * all external references it makes, and gathers detailed information about each reference to build a comprehensive
 * context. The result includes the location of the function and the expanded context of its dependencies.
 *
 * @param projectRoot - The root directory of the project.
 * @param compiledFunction - The string representation of the function to expand (compiled JavaScript, not TypeScript).
 * @param options - Optional parameters for the expansion process.
 * @param options.skipSourceMap - If `true`, skips the source map search. Useful for testing scenarios.
 * @param options.debug - If `true`, enables debug logging for detailed tracing.
 * @param options.hints - Provides contextual hints for the search.
 * @param options.hints.sourceFunction - The string representation of the source TypeScript function to expand.
 * @param options.hints.sourceFile - The file path containing the source function to expand.
 * @returns A promise that resolves to an `ExpandedFunctionResult` containing the expanded context of the function,
 *          or `null` if the function is not found within the project.
 *
 * @example
 * ```typescript
 * const result = await expandFunction('/path/to/project', 'function example2(t) { ... }', {
 *   debug: true,
 *   hints: {
 *     sourceFunction: 'function example<T>(t: T) { ... }',
 *     sourceFile: 'src/example.ts',
 *   },
 * });
 * ```
 */
export async function expandFunction(
  projectRoot: string,
  compiledFunction: string,
  options: ExpandFunctionOptions = {},
): Promise<ExpandedFunctionResult | null> {
  const searchResult = await searchFunction(
    projectRoot,
    compiledFunction,
    options,
  );
  if (!searchResult) {
    const truncatedFunc = compiledFunction.slice(0, 100);
    logger.warn(
      `[expandFunction] No search result found for ${truncatedFunc}...`,
    );
    return null;
  }

  const identifiers = analyzeOutOfScopeIdentifiers(
    searchResult.node,
    searchResult.sourceFile,
  );

  const context = await extractContext(
    projectRoot,
    searchResult.file,
    identifiers,
  );

  return {
    ...searchResult,
    context,
  };
}

/**
 * Extracts the expanded context of out-of-scope identifiers within a function by analyzing their definitions.
 * This involves querying the TypeScript server to locate definitions, handling namespace imports, and recursively
 * expanding the context for functions. The function aggregates detailed information about each identifier,
 * including its type, position, definition details, and package information if applicable.
 *
 * @param projectRoot - The root directory of the project.
 * @param filePath - The file path where the original function is located.
 * @param identifiers - An array of `OutOfScopeIdentifier` representing identifiers that are not defined within the function's scope.
 * @param options - Optional parameters to modify the extraction behavior.
 * @param options.debug - If `true`, enables debug logging for detailed tracing during context extraction.
 * @returns A promise that resolves to an `ExpandedFunctionContext`, detailing the context of each out-of-scope identifier.
 *
 * @example
 * ```typescript
 * const context = await extractContext('/path/to/project', 'src/example.ts', identifiers, { debug: true });
 * ```
 */
async function extractContext(
  projectRoot: string,
  filePath: string,
  identifiers: OutOfScopeIdentifier[],
  options: { debug?: boolean } = { debug: false },
): Promise<ExpandedFunctionContext> {
  const { debug } = options;
  const context: ExpandedFunctionContext = [];

  if (!identifiers?.length) {
    if (debug) {
      logger.debug(
        "[debug] No out of scope identifiers found in function, skipping context extraction",
      );
    }
    return context;
  }

  try {
    const { connection } = await getTSServer(projectRoot);

    // Open the document containing the function
    // This makes the TSServer aware of the codebase, and allows us to execute requests
    // We do this to get more information on the definitions of the function's out-of-scope identifiers
    //
    await openFile(connection, filePath);

    const funcFileUri = getFileUri(filePath);

    // Loop through each identifier in the function and find its definition
    for (const identifier of identifiers) {
      const [sourceDefinition, textDocumentDefinition] = await Promise.all([
        getTsSourceDefinition(connection, funcFileUri, identifier.position),
        getTextDocumentDefinition(connection, funcFileUri, identifier.position),
      ]);

      // Here we can filter out standard globals that are defined in the runtime
      //   (e.g., `console`, `URL`, `Number`, etc.)
      // We can do this because the textDocumentDefinition will be a .d.ts file, while the sourceDefinition will not be present
      // This is a bit of a hack, but it works for now
      const isStandardGlobal =
        !sourceDefinition && textDocumentDefinition?.uri?.endsWith(".d.ts");
      if (isStandardGlobal) {
        if (debug) {
          logger.debug(
            `[debug] Skipping expansion of ${identifier.name} as it is likely a standard global in the runtime`,
          );
        }
        continue;
      }

      if (sourceDefinition) {
        // Find the node at the definition position
        const { node, sourceFile, definitionFilePath } =
          definitionToNode(sourceDefinition);

        // If there's a node, we can try to extract the value of the definition
        if (node) {
          // First, handle the case where it was imported from another file.
          // As of writing, we will hit this case when you do `import * as schema from "./db"`
          //
          const parentImportDeclaration = getParentImportDeclaration(node);
          if (
            parentImportDeclaration &&
            ts.isImportDeclaration(parentImportDeclaration)
          ) {
            const importClause = parentImportDeclaration.importClause;

            // Check if it's a namespace import (e.g., import * as schema from "./db")
            if (
              importClause?.namedBindings &&
              ts.isNamespaceImport(importClause.namedBindings)
            ) {
              const namespaceName = importClause.namedBindings.name.text;
              const moduleSpecifier = parentImportDeclaration.moduleSpecifier
                .getText()
                .replace(/['"]/g, "");

              // Resolve the imported module's file path using a utility that can account for TypeScript path aliases
              const importedFilePath = resolveModulePath(
                moduleSpecifier,
                filePath,
                projectRoot,
              );

              if (!importedFilePath) {
                logger.warn(
                  `[extractContext] Failed to resolve imported file path for ${identifier.name}`,
                );
                continue;
              }

              // Read the contents of the imported file
              let importedFileContent: string;
              try {
                importedFileContent = await fs.promises.readFile(
                  importedFilePath,
                  "utf-8",
                );
              } catch (readError) {
                logger.warn(
                  `[extractContext] Failed to read imported file at ${importedFilePath} for namespace import ${namespaceName}`,
                  readError,
                );
                continue;
              }

              // Create a context entry with the entire file's contents
              const contextEntry: ExpandedFunctionContextEntry = {
                name: namespaceName,
                type: "unknown",
                position: identifier.position,
                definition: {
                  uri: getFileUri(importedFilePath),
                  range: {
                    start: { line: 0, character: 0 },
                    end: {
                      line: Number.MAX_SAFE_INTEGER,
                      character: Number.MAX_SAFE_INTEGER,
                    },
                  },
                  text: importedFileContent,
                },
                // Optionally include package information if applicable
                package: extractPackageName(sourceDefinition.uri) ?? undefined,
              };

              context.push(contextEntry);
              continue;
            }

            const contextEntry = await contextForImport(
              connection,
              projectRoot,
              definitionFilePath,
              parentImportDeclaration,
              node,
              identifier,
            );

            // TODO - Recurse definition from imported files (not implemented yet)
            if (contextEntry) {
              context.push(contextEntry);
              continue;
            }

            logger.warn(
              `[extractContext] Failed to follow import for ${identifier.name}`,
            );
          }

          // HACK - If we resolved the definition to node_modules,
          //        we can skip any recursive expansion and just add the import as context for now
          const isNodeModule = sourceDefinition?.uri?.includes("node_modules");

          if (isNodeModule) {
            if (debug) {
              logger.debug(
                `[debug] ${identifier.name} is likely an installed dependency`,
              );
            }

            const contextEntry: ExpandedFunctionContextEntry = {
              name: identifier.name,
              // HACK - `unknown` just means "do not expand this"
              type: "unknown",
              position: identifier.position,
              definition: {
                uri: sourceDefinition.uri,
                range: sourceDefinition.range,
                // NOTE - We do not include definition text here, since it can be huge (since this is from a node_modules package)
                text: "#third-party-library-code",
              },
              package: extractPackageName(sourceDefinition.uri) ?? undefined,
            };
            context.push(contextEntry);
            continue;
          }

          const valueText = getDefinitionText(node, sourceFile);

          const contextEntry: ExpandedFunctionContextEntry = {
            name: identifier.name,
            type: valueText?.type ?? "unknown",
            position: identifier.position,
            definition: {
              uri: sourceDefinition.uri,
              range: sourceDefinition.range,
              text: valueText?.text,
            },
          };

          if (debug) {
            logger.debug(
              `[debug] [extractContext] Context entry for ${identifier.name}`,
              contextEntry,
            );
          }

          // Recursively expand context if the identifier is a function
          if (contextEntry?.type === "function") {
            const functionNode = valueText?.definitionNode ?? node;
            if (!functionNode) {
              logger.warn(
                `[extractContext] No function body found for ${identifier.name}`,
              );
              continue;
            }

            // Do type narrowing on the result to appease the call to analyzeOutOfScopeIdentifiers
            if (
              !ts.isFunctionDeclaration(functionNode) &&
              !ts.isArrowFunction(functionNode) &&
              !ts.isFunctionExpression(functionNode)
            ) {
              logger.warn(
                `[extractContext] An unexpected node was returned for ${identifier.name}`,
              );
              continue;
            }

            const functionIdentifiers = analyzeOutOfScopeIdentifiers(
              functionNode,
              sourceFile,
            );

            if (debug) {
              logger.debug(
                `[debug] [extractContext] Analyzed NESTED out of scope identifiers for ${identifier.name}`,
                functionIdentifiers,
              );
            }

            const subContext = await extractContext(
              projectRoot,
              sourceDefinition.uri.replace(/^file:\/\//, ""),
              functionIdentifiers,
            );
            contextEntry.context = subContext;
          }

          context.push(contextEntry);
        } else {
          logger.warn(
            `[extractContext] AST parsing found no definition found for ${identifier.name} in ${definitionFilePath}`,
          );
        }
      } else {
        logger.warn(
          `[extractContext] TSServer found no definition found for ${identifier.name}`,
        );
      }
    }
  } catch (error) {
    logger.error("[extractContext] Error querying TSServer:", error);
  }

  return context;
}

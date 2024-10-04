import fs from "node:fs";
import { promisify } from "node:util";
import { parse } from "acorn";
import { simple as walkSimple } from "acorn-walk";
import {
  type RawIndexMap,
  type RawSourceMap,
  SourceMapConsumer,
} from "source-map";
import logger from "../../logger.js";

const readFileAsync = promisify(fs.readFile);

type FunctionLocation = {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
};

/**
 * Finds the locations of specified function definitions within the provided JavaScript file contents.
 *
 * @param {string} jsFileContents - The contents of the JavaScript file to search.
 * @param {Array<string>} functionDefinitions - An array of function definition strings to locate.
 * @returns {Promise<Record<string, { normalized: string; foundLocation: FunctionLocation | null }>>}
 *          A promise that resolves to a record mapping each function definition to its normalized form and location.
 */
async function findFunctionsByDefinition(
  jsFileContents: string,
  functionDefinitions: Array<string>,
): Promise<
  Record<string, { normalized: string; foundLocation: FunctionLocation | null }>
> {
  try {
    // Create a map of function definitions to their normalized form and foundLocation
    const functionMap = functionDefinitions.reduce(
      (acc, def) => {
        acc[def] = {
          normalized: def.replace(/\s+/g, " ").trim(),
          foundLocation: null,
        };
        return acc;
      },
      {} as Record<
        string,
        { normalized: string; foundLocation: FunctionLocation | null }
      >,
    );

    const ast = parse(jsFileContents, {
      ecmaVersion: "latest",
      locations: true,
      sourceType: "module",
    });

    walkSimple(ast, {
      FunctionDeclaration(node) {
        for (const key in functionMap) {
          if (functionMap[key].foundLocation) {
            continue;
          }
          const funcSource = jsFileContents.substring(node.start, node.end);
          if (
            node.loc &&
            funcSource.replace(/\s+/g, " ").trim() ===
              functionMap[key].normalized
          ) {
            functionMap[key].foundLocation = {
              startLine: node.loc.start.line,
              startColumn: node.loc.start.column + 1,
              endLine: node.loc.end.line,
              endColumn: node.loc.end.column + 1,
            };
          }
        }
      },
      FunctionExpression(node) {
        for (const key in functionMap) {
          if (functionMap[key].foundLocation) {
            continue;
          }
          const funcSource = jsFileContents.substring(node.start, node.end);
          if (
            node.loc &&
            funcSource.replace(/\s+/g, " ").trim() ===
              functionMap[key].normalized
          ) {
            functionMap[key].foundLocation = {
              startLine: node.loc.start.line,
              startColumn: node.loc.start.column + 1,
              endLine: node.loc.end.line,
              endColumn: node.loc.end.column + 1,
            };
          }
        }
      },
      ArrowFunctionExpression(node) {
        for (const key in functionMap) {
          if (functionMap[key].foundLocation) {
            continue;
          }
          const funcSource = jsFileContents.substring(node.start, node.end);
          if (
            node.loc &&
            funcSource.replace(/\s+/g, " ").trim() ===
              functionMap[key].normalized
          ) {
            functionMap[key].foundLocation = {
              startLine: node.loc.start.line,
              startColumn: node.loc.start.column + 1,
              endLine: node.loc.end.line,
              endColumn: node.loc.end.column + 1,
            };
          }
        }
      },
    });

    return functionMap;
  } catch {
    logger.error("[findFunctionByDefinition] Error parsing js file contents");
    return {};
  }
}

/**
 * Finds the original source position for a given position in the compiled JavaScript using a source map.
 *
 * @param {RawSourceMap | RawIndexMap} sourceMapContent - The source map content.
 * @param {number} line - The line number in the compiled JavaScript file.
 * @param {number} column - The column number in the compiled JavaScript file.
 * @returns {Promise<{ source: string | null; sourceContent: string | null; line: number | null; column: number | null }>}
 *          A promise that resolves to the original source position and content.
 * @throws Will throw an error if the source map is not valid JSON.
 */
async function findOriginalSource(
  sourceMapContent: RawSourceMap | RawIndexMap,
  line: number,
  column: number,
) {
  return await SourceMapConsumer.with(sourceMapContent, null, (consumer) => {
    const pos = consumer.originalPositionFor({
      line, // Line number from JS file
      column, // Column number from JS file
    });

    consumer.destroy();

    // Optional: Display the source code snippet if needed
    const returnNullOnMissing = true;
    const sourceContent = consumer.sourceContentFor(
      pos.source ?? "",
      returnNullOnMissing,
    );

    return { ...pos, sourceContent };
  });
}

export type SourceFunctionResult = {
  /** The (compiled) function text that was used to find the source */
  functionText: string;
  /** The source file */
  sourceFile: string | null;
  /** The source code of the function */
  sourceFunction: string | null;
};

/**
 * Finds the original source functions corresponding to compiled function texts using source maps.
 *
 * @param {string} jsFilePath - The path to the compiled JavaScript file.
 * @param {string | Array<string>} compiledFunctionText - The compiled function text(s) to locate in the source.
 * @param {boolean} [returnNullOnMissing=false] - Whether to return null when a source function is missing.
 * @param {Object} [hints={}] - Optional hints to provide preloaded source map content or JavaScript file contents.
 * @param {RawSourceMap | RawIndexMap} [hints.sourceMapContent] - Preloaded source map content.
 * @param {string} [hints.jsFileContents] - Preloaded JavaScript file contents.
 * @returns {Promise<Array<SourceFunctionResult>>} A promise that resolves to an array of results mapping compiled functions to their sources.
 */
export async function findSourceFunctions(
  jsFilePath: string,
  compiledFunctionText: string | Array<string>,
  returnNullOnMissing = false,
  hints: {
    sourceMapContent?: RawSourceMap | RawIndexMap;
    jsFileContents?: string;
  } = {},
): Promise<Array<SourceFunctionResult>> {
  const mapFile = `${jsFilePath}.map`;
  // OPTIMIZE - This is a hot path, so we should cache the source map content
  //            Each parse takes about 10ms even on a medium sized codebase
  const sourceMapContent =
    hints.sourceMapContent ??
    JSON.parse(await readFileAsync(mapFile, { encoding: "utf8" }));
  const jsFileContents =
    hints.jsFileContents ??
    (await readFileAsync(jsFilePath, { encoding: "utf8" }));

  const functionDefinitions = Array.isArray(compiledFunctionText)
    ? compiledFunctionText
    : [compiledFunctionText];

  const locations = await findFunctionsByDefinition(
    jsFileContents,
    functionDefinitions,
  );

  const results = await Promise.all(
    Object.entries(locations).map(
      async ([compiledFunctionText, { foundLocation }]) => {
        if (!foundLocation) {
          return {
            functionText: compiledFunctionText,
            sourceFile: null,
            sourceFunction: null,
          };
        }
        const lookupResult = await lookUpLocation(foundLocation);
        return {
          functionText: compiledFunctionText,
          sourceFile: lookupResult?.sourceFile ?? null,
          sourceFunction: lookupResult?.sourceFunction ?? null,
        };
      },
    ),
  );

  return results;

  /**
   * Looks up the original source function based on a function's location in the compiled code.
   *
   * @param {FunctionLocation} loc - The location of the function in the compiled JavaScript file.
   * @returns {Promise<{ sourceFunction: string | null; source: string | null } | null>}
   *          A promise that resolves to the original source function and its source file, or null if not found.
   */
  async function lookUpLocation(loc: FunctionLocation) {
    const functionStartLine = loc?.startLine ?? 0;
    const functionStartColumn = loc?.startColumn ?? 0;
    const functionEndLine = loc?.endLine ?? 0;
    const functionEndColumn = loc?.endColumn ?? 0;

    // NOTE - We want to execute these in parallel, time is of the essence
    const [sourceFunctionStart, sourceFunctionEnd] = await Promise.all([
      findOriginalSource(
        sourceMapContent,
        functionStartLine,
        functionStartColumn,
      ),
      findOriginalSource(sourceMapContent, functionEndLine, functionEndColumn),
    ]);

    const sourceFile = sourceFunctionStart.source;
    const sourceContent = sourceFunctionStart.sourceContent ?? "";
    const startLine = sourceFunctionStart.line;
    const startColumn = sourceFunctionStart.column;
    const endLine = sourceFunctionEnd.line;
    const endColumn = sourceFunctionEnd.column;
    // Check if the start/end line are null and otherwise just return sourceContent as is
    if (startLine === null || endLine === null) {
      // TODO decide what the proper behavior should be when
      // we can't find the correct source content.
      // For now: return the source content as is
      return returnNullOnMissing
        ? null
        : { sourceContent, sourceFile, sourceFunction: null };
    }

    const lines = sourceContent.split("\n").slice(startLine - 1, endLine);
    const sourceFunction = lines
      .map((line, index) => {
        if (index === 0 && startLine === endLine) {
          return line.slice(startColumn ?? 0, endColumn ?? 0);
        }
        if (index === 0) {
          return line.slice(startColumn ?? 0);
        }
        if (index === endLine - startLine) {
          // MEGA HACK - Add 1 to the end column only if it ends in a comma
          // I don't know what was causing this issue, but when we parse the source code,
          // we need to account for the fact that the original source code might have
          // trailing commas in functions that are passed as arguments to other functions.
          // In that case, we need to add 1 to the end column to account for something that gets odd when receiving the location back.
          const endsInComma = line.endsWith(",");
          return line.slice(0, (endColumn ?? 0) + (endsInComma ? 1 : 0));
        }
        return line;
      })
      .join("\n");

    return { sourceFunction, sourceFile };
  }
}

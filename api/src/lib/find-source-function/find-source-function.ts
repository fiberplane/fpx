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

interface FunctionLocation {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

async function findFunctionByDefinition(
  jsFileContents: string,
  functionDefinitions: Array<string>,
): Promise<FunctionLocation | null> {
  try {
    const normalizedFunctionDefinition = functionDefinitions[0]
      .replace(/\s+/g, " ")
      .trim();

    const ast = parse(jsFileContents, {
      ecmaVersion: "latest",
      locations: true,
      sourceType: "module",
    });

    let foundLocation: FunctionLocation | null = null;

    walkSimple(ast, {
      FunctionDeclaration(node) {
        if (foundLocation) {
          return;
        }
        // Extract function source from original content based on node's location
        const funcSource = jsFileContents.substring(node.start, node.end);
        if (
          funcSource.replace(/\s+/g, " ").trim() ===
            normalizedFunctionDefinition &&
          node.loc
        ) {
          foundLocation = {
            startLine: node.loc.start.line,
            startColumn: node.loc.start.column + 1,
            endLine: node.loc.end.line,
            endColumn: node.loc.end.column + 1,
          };
        }
      },
      FunctionExpression(node) {
        if (foundLocation) {
          return;
        }
        // Repeat as FunctionDeclaration
        const funcSource = jsFileContents.substring(node.start, node.end);
        if (
          funcSource.replace(/\s+/g, " ").trim() ===
            normalizedFunctionDefinition &&
          node.loc
        ) {
          foundLocation = {
            startLine: node.loc.start.line,
            startColumn: node.loc.start.column + 1,
            endLine: node.loc.end.line,
            endColumn: node.loc.end.column + 1,
          };
        }
      },
      ArrowFunctionExpression(node) {
        if (foundLocation) {
          return;
        }
        const funcSource = jsFileContents.substring(node.start, node.end);
        if (
          funcSource.replace(/\s+/g, " ").trim() ===
            normalizedFunctionDefinition &&
          node.loc
        ) {
          foundLocation = {
            startLine: node.loc.start.line,
            startColumn: node.loc.start.column + 1,
            endLine: node.loc.end.line,
            endColumn: node.loc.end.column + 1,
          };
        }
      },
    });

    return foundLocation;
  } catch {
    logger.error("[findFunctionByDefinition] Error parsing js file contents");
    return null;
  }
}

/**
 * This function will throw an error if the map file is not valid json
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
    // console.log('Original Source:', pos);
    // Optional: Display the source code snippet if needed

    const returnNullOnMissing = true;
    const sourceContent = consumer.sourceContentFor(
      pos.source ?? "",
      returnNullOnMissing,
    );

    // console.log('Source Content:\n', sourceContent);
    return { ...pos, sourceContent };
  });
}

export async function findSourceFunctions(
  jsFilePath: string,
  functionText: string | Array<string>,
  returnNullOnMissing = false,
  hints: {
    sourceMapContent?: RawSourceMap | RawIndexMap;
    jsFileContents?: string;
  } = {},
) {
  const mapFile = `${jsFilePath}.map`;
  // OPTIMIZE - This is a hot path, so we should cache the source map content
  //            Each parse takes about 10ms even on a medium sized codebase
  const sourceMapContent =
    hints.sourceMapContent ??
    JSON.parse(await readFileAsync(mapFile, { encoding: "utf8" }));
  const jsFileContents =
    hints.jsFileContents ??
    (await readFileAsync(jsFilePath, { encoding: "utf8" }));

  const functionDefinitions = Array.isArray(functionText)
    ? functionText
    : [functionText];

  return findFunctionByDefinition(jsFileContents, functionDefinitions).then(
    async (loc) => {
      const functionStartLine = loc?.startLine ?? 0;
      const functionStartColumn = loc?.startColumn ?? 0;
      const functionEndLine = loc?.endLine ?? 0;
      const functionEndColumn = loc?.endColumn ?? 0;

      const [sourceFunctionStart, sourceFunctionEnd] = await Promise.all([
        findOriginalSource(
          sourceMapContent,
          functionStartLine,
          functionStartColumn,
        ),
        findOriginalSource(
          sourceMapContent,
          functionEndLine,
          functionEndColumn,
        ),
      ]);

      const source = sourceFunctionStart.source;
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
          : { sourceContent, source, sourceFunction: null };
      }

      const lines = sourceContent.split("\n").slice(startLine - 1, endLine);
      // console.log("lines", lines);
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

      return { sourceFunction, source };
    },
  );
}

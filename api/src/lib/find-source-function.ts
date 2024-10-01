import fs from "node:fs";
import { promisify } from "node:util";
import { parse } from "acorn";
import { simple as walkSimple } from "acorn-walk";
import { SourceMapConsumer } from "source-map";

const readFileAsync = promisify(fs.readFile);

interface FunctionLocation {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

async function findFunctionByDefinition(
  jsFilePath: string,
  functionDefinition: string,
): Promise<FunctionLocation | null> {
  try {
    const fileContent = await readFileAsync(jsFilePath, { encoding: "utf-8" });
    const ast = parse(fileContent, {
      ecmaVersion: "latest",
      locations: true,
      sourceType: "module",
    });

    let foundLocation: FunctionLocation | null = null;

    walkSimple(ast, {
      FunctionDeclaration(node) {
        // Extract function source from original content based on node's location
        const funcSource = fileContent.substring(node.start, node.end);
        if (
          funcSource.replace(/\s+/g, " ").trim() ===
            functionDefinition.replace(/\s+/g, " ").trim() &&
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
        // Repeat as FunctionDeclaration
        const funcSource = fileContent.substring(node.start, node.end);
        if (
          funcSource.replace(/\s+/g, " ").trim() ===
            functionDefinition.replace(/\s+/g, " ").trim() &&
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
        // Repeat as FunctionDeclaration
        const funcSource = fileContent.substring(node.start, node.end);
        if (
          funcSource.replace(/\s+/g, " ").trim() ===
            functionDefinition.replace(/\s+/g, " ").trim() &&
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
    console.error("Error reading or parsing file:", jsFilePath);
    return null;
  }
}

/**
 * This function will throw an error if the
 */
async function findOriginalSource(
  jsFile: string,
  line: number,
  column: number,
) {
  const mapFile = `${jsFile}.map`; // Adjust if your source map is located elsewhere
  const sourceMapContent = JSON.parse(fs.readFileSync(mapFile, "utf8"));

  return await SourceMapConsumer.with(sourceMapContent, null, (consumer) => {
    const pos = consumer.originalPositionFor({
      line: line, // Line number from JS file
      column: column, // Column number from JS file
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

export async function findSourceFunction(
  jsFilePath: string,
  functionText: string,
  returnNullOnMissing = false,
) {
  return findFunctionByDefinition(jsFilePath, functionText).then(
    async (loc) => {
      const functionStartLine = loc?.startLine ?? 0;
      const functionStartColumn = loc?.startColumn ?? 0;
      console.log(
        "[debug][findSourceFunction] functionStartLine",
        functionStartLine,
      );
      console.log(
        "[debug][findSourceFunction] functionStartColumn",
        functionStartColumn,
      );
      const functionEndLine = loc?.endLine ?? 0;
      const functionEndColumn = loc?.endColumn ?? 0;
      console.log(
        "[debug][findSourceFunction] functionEndLine",
        functionEndLine,
      );
      console.log(
        "[debug][findSourceFunction] functionEndColumn",
        functionEndColumn,
      );

      const [sourceFunctionStart, sourceFunctionEnd] = await Promise.all([
        findOriginalSource(jsFilePath, functionStartLine, functionStartColumn),
        findOriginalSource(jsFilePath, functionEndLine, functionEndColumn),
      ]);

      console.log(
        "[debug][findSourceFunction] sourceFunctionStart",
        sourceFunctionStart,
      );
      console.log(
        "[debug][findSourceFunction] sourceFunctionEnd",
        sourceFunctionEnd,
      );

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
        return returnNullOnMissing ? null : sourceContent;
      }

      const sourceFunction = sourceContent
        .split("\n")
        .slice(startLine - 1, endLine)
        .map((line, index) => {
          if (index === 0 && startLine === endLine) {
            return line.slice(startColumn ?? 0, endColumn ?? 0);
          }
          if (index === 0) {
            return line.slice(startColumn ?? 0);
          }
          if (index === endLine - startLine) {
            return line.slice(0, endColumn ?? 0);
          }
          return line;
        })
        .join("\n");

      // console.log('Function source:', sourceFunction)
      return sourceFunction;
    },
  );
}

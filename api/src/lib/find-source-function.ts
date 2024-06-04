import fs from "fs";
import { promisify } from "util";
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
          functionDefinition.replace(/\s+/g, " ").trim()
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
          functionDefinition.replace(/\s+/g, " ").trim()
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
          functionDefinition.replace(/\s+/g, " ").trim()
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
  } catch (error) {
    console.error("Error reading or parsing file:", jsFilePath);
    return null;
  }
}

async function findOriginalSource(
  jsFile: string,
  line: number,
  column: number,
) {
  const mapFile = jsFile + ".map"; // Adjust if your source map is located elsewhere
  const sourceMapContent = JSON.parse(fs.readFileSync(mapFile, "utf8"));

  return await SourceMapConsumer.with(sourceMapContent, null, (consumer) => {
    const pos = consumer.originalPositionFor({
      line: line, // Line number from JS file
      column: column, // Column number from JS file
    });

    consumer.destroy();
    // console.log('Original Source:', pos);
    // Optional: Display the source code snippet if needed
    const sourceContent = consumer.sourceContentFor(pos.source);
    // console.log('Source Content:\n', sourceContent);
    return { ...pos, sourceContent };
  });
}

export async function findSourceFunction(
  jsFilePath: string,
  functionText: string,
) {
  return findFunctionByDefinition(jsFilePath, functionText).then(
    async (loc) => {
      const functionStartLine = loc?.startLine ?? 0;
      const functionStartColumn = loc?.startColumn ?? 0;
      const functionEndLine = loc?.endLine ?? 0;
      const functionEndColumn = loc?.endColumn ?? 0;

      const [sourceFunctionStart, sourceFunctionEnd] = await Promise.all([
        findOriginalSource(jsFilePath, functionStartLine, functionStartColumn),
        findOriginalSource(jsFilePath, functionEndLine, functionEndColumn),
      ]);

      // console.log('Function start:', sourceFunctionStart);
      // console.log('Function end:', sourceFunctionEnd);

      const sourceContent = sourceFunctionStart?.sourceContent ?? "";
      const sourceFunction = sourceContent
        .split("\n")
        .filter(
          (_, i) =>
            i >= sourceFunctionStart.line - 1 &&
            i <= sourceFunctionEnd.line - 1,
        )
        .join("\n");

      // console.log('Function source:', sourceFunction)
      return sourceFunction;
    },
  );
}
/**
 * Example Usage
 * 
  const functionText = `async (c) => {
    const { id: idString } = c.req.param();
    const id = Number.parseInt(idString, 10);
    const sql2 = zs(process.env.DATABASE_URL ?? "");
    const db = drizzle(sql2, { schema: schema_exports });
    const bug = await db.select().from(bugs).where(eq(bugs.id, id));
    return c.json(bug);
  }`;

  const FILE_PATH = './scripts/function-loc-index.js';

 *
 */

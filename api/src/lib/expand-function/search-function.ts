import * as fs from "node:fs";
import * as path from "node:path";
import * as ts from "typescript";

export type FunctionOutOfScopeIdentifiers = Array<{
  /** The name of the constant or utility in the code */
  name: string;
  /** The type of the constant or utility (function, string, etc) */
  type: string;
  /** The position of the constant or utility in the code */
  position: ts.LineAndCharacter;
}>;

type SearchFunctionResult = {
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
  identifiers: FunctionOutOfScopeIdentifiers;
};

export function searchForFunction(dirPath: string, searchString: string) {
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      searchForFunction(filePath, searchString);
    } else if (
      stats.isFile() &&
      (file.endsWith(".ts") || file.endsWith(".tsx"))
    ) {
      const result = searchFile(filePath, searchString);
      if (result) {
        return result;
      }
    }
  }

  return null;
}

function searchFile(
  filePath: string,
  searchString: string,
): SearchFunctionResult | null {
  console.debug("[debug] Searching file:", filePath);
  const sourceFile = ts.createSourceFile(
    filePath,
    fs.readFileSync(filePath, "utf-8"),
    ts.ScriptTarget.Latest,
    true,
  );

  let result: SearchFunctionResult | null = null;

  function visit(node: ts.Node) {
    const isFunction =
      ts.isFunctionDeclaration(node) || ts.isArrowFunction(node);
    // if (isFunction) {
    //   console.log("matched function node:", node);
    //   console.log(node?.getText());
    // }
    // Look for the matching function definition
    if (isFunction && node?.getText() === searchString) {
      console.debug("[debug] matched function we were looking for!");
      const { line: startLine, character: startColumn } =
        sourceFile.getLineAndCharacterOfPosition(node.getStart());
      const { line: endLine, character: endColumn } =
        sourceFile.getLineAndCharacterOfPosition(node.getEnd());

      const identifiers: FunctionOutOfScopeIdentifiers = [];
      // const program = ts.createProgram([filePath], {});
      // const checker = program.getTypeChecker();

      // Now we want to determin all identifiers that are in scope,
      // and all identifiers that are used but not declared in the current function
      // We can do this by traversing the AST and collecting declarations and usages
      const localDeclarations = new Set<string>();
      const usedIdentifiers = new Map<string, ts.LineAndCharacter>();

      // First pass: recursively collect local declaration
      //
      // NOTE - This should not incur a stack overflow, in spite of its recursion,
      // because the function is not calling itself, it's passing itself to an iterator as a callback
      ts.forEachChild(node, function collectDeclarations(childNode) {
        if (
          ts.isVariableDeclaration(childNode) &&
          childNode.name.kind === ts.SyntaxKind.Identifier
        ) {
          localDeclarations.add(childNode.name.text);
        }
        if (
          ts.isParameter(childNode) &&
          childNode.name.kind === ts.SyntaxKind.Identifier
        ) {
          localDeclarations.add(childNode.name.text);
        }
        ts.forEachChild(childNode, collectDeclarations);
      });

      // Second pass: collect used identifiers
      // - If it's a property access on a declared local variable, skip it
      ts.forEachChild(node, function collectIdentifiers(childNode) {
        if (ts.isIdentifier(childNode)) {
          // Check if the identifier is part of a property access
          if (ts.isPropertyAccessExpression(childNode.parent)) {
            // If it's the property name, skip it
            if (childNode === childNode.parent.name) {
              return;
            }
            // If it's the expression (left-hand side) and it's a local variable, skip it
            if (
              childNode === childNode.parent.expression &&
              localDeclarations.has(childNode.text)
            ) {
              return;
            }
            // If it's the expression but not a local variable, include it
            // Example: Property accesse expression on an out-of-scope variable
            if (childNode === childNode.parent.expression) {
              const pos = sourceFile.getLineAndCharacterOfPosition(
                childNode.getStart(),
              );
              usedIdentifiers.set(childNode.text, pos);
              return;
            }
          }

          // If it's not a local declaration and not part of a skipped property access, add it
          if (!localDeclarations.has(childNode.text)) {
            const pos = sourceFile.getLineAndCharacterOfPosition(
              childNode.getStart(),
            );
            usedIdentifiers.set(childNode.text, pos);
          }
        }
        ts.forEachChild(childNode, collectIdentifiers);
      });

      // Add out-of-scope identifiers to context
      usedIdentifiers.forEach((position, identifier) => {
        identifiers.push({
          name: identifier,
          // We can't reliably get the type without a working symbol table,
          // which I think would require loading the entire project (all files) in to a
          // typescript program and using its checker
          type: "unknown",
          position,
        });
      });

      console.log("identifiers", identifiers);

      result = {
        file: filePath,
        startLine: startLine + 1,
        startColumn: startColumn + 1,
        endLine: endLine + 1,
        endColumn: endColumn + 1,
        identifiers,
      };
    }

    // Only continue traversing if we haven't found a match yet
    if (!result) {
      ts.forEachChild(node, visit);
    }
  }

  visit(sourceFile);

  return result;
}

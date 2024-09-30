import * as ts from "typescript";
import * as path from "node:path";

function createProgram(filePath: string): ts.Program {
  const configPath = ts.findConfigFile(
    path.dirname(filePath),
    ts.sys.fileExists,
    "tsconfig.json",
  );

  if (!configPath) {
    throw new Error("Could not find a valid 'tsconfig.json'.");
  }

  const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
  const { options, fileNames } = ts.parseJsonConfigFileContent(
    config,
    ts.sys,
    path.dirname(configPath),
  );

  return ts.createProgram(fileNames, options);
}

// Resolve the path and analyze the 'src' directory
const projectRoot = path.resolve(
  __dirname,
  "../../../../../examples/test-static-analysis",
);

const targetFunction = `(c) => {
  const auth = getAuthHeader(c.req);
  if (auth && PASSPHRASES.includes(auth)) {
    return c.text("Hello Hono!");
  }
  return c.text("Unauthorized", 401);
}`;

function isInsideRange(val: number, start: number, end: number) {
  return val >= start && val <= end;
}

function findMatchingFunctionExpressions(node: ts.Node, handler: string) {
  const matches: Array<ts.ArrowFunction | ts.FunctionExpression> = [];
  function visit(node: ts.Node) {
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
      const nodeText = node.getFullText().trim();
      if (nodeText === handler) {
        matches.push(node);
      }
    }

    ts.forEachChild(node, visit);
  }
  visit(node);
  return matches;
}

function getResolvedDeclarations(node: ts.Node, checker: ts.TypeChecker, parentStartEnd: [number, number]) {
  const context: ts.Declaration[] = [];
  const [start, end] = parentStartEnd;

  function visit(node: ts.Node) {
    if (ts.isCallExpression(node)) {
      const resolvedNode = checker
        .getResolvedSignature(node)
        ?.getDeclaration();
      if (resolvedNode?.kind === ts.SyntaxKind.FunctionDeclaration) {
        context.push(resolvedNode);
      }
    }
    if (ts.isIdentifier(node)) {
      const symbol = checker.getSymbolAtLocation(node);
      const [declaration] = symbol?.getDeclarations() || [];
      if (
        declaration.kind === ts.SyntaxKind.VariableDeclaration &&
        !isInsideRange(declaration.pos, start, end)
      ) {
        context.push(declaration);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(node);
  return context;
}

function matchWithContext(filePath: string, handler: string) {
  const program = createProgram(filePath);
  const sourceFile = program.getSourceFile(filePath);
  if (!sourceFile) {
    throw new Error(`Could not find source file: ${filePath}`);
  }
  const checker = program.getTypeChecker();
  const matches = findMatchingFunctionExpressions(sourceFile, handler);
  if (matches.length === 1) {
    const [matchedNode] = matches;
    const context = getResolvedDeclarations(matchedNode, checker, [matchedNode.pos, matchedNode.end]);
    return [...context, matchedNode];
  }
}
describe("ast-jogger", () => {
  it("should jog the ast", () => {
    const match = matchWithContext(projectRoot + "/src/index.ts", targetFunction);
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const result = match?.map((node) =>
      printer.printNode(ts.EmitHint.Unspecified, node, node.getSourceFile()),
    ).join("\n");
    expect(result).toMatchSnapshot();
  });
});

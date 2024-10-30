import path from "node:path";
import { SourceReferenceManager } from "../SourceReferenceManager";
import {
  HONO_HTTP_METHODS,
  type MiddlewareEntry,
  type RouteEntry,
  type RouteTree,
  type SearchContext,
  type TsArrowFunction,
  type TsCallExpression,
  TsDeclaration,
  type TsExpression,
  type TsFunctionDeclaration,
  type TsFunctionExpression,
  type TsLanguageService,
  type TsNode,
  type TsNodeArray,
  type TsReferenceEntry,
  type TsReturnStatement,
  type TsSourceFile,
  type TsType,
  type TsVariableDeclaration,
} from "../types";
import { debugSymbolAtLocation } from "../utils";
import { createSourceReferenceForNode } from "./extractReferences";
import { findNodeAtPosition } from "./utils";

export function extractRouteTrees(
  service: TsLanguageService,
  ts: TsType,
  projectRoot,
): {
  errorCount?: number;
  results: Array<RouteTree>;
} {
  const sourceReferenceManager = new SourceReferenceManager();
  const program = service.getProgram();
  const checker = program.getTypeChecker();

  if (!program) {
    throw new Error("Program not found");
  }

  const apps: Array<RouteTree> = [];
  const files = program.getSourceFiles();
  const fileMap: Record<string, TsSourceFile> = {};
  for (const file of files) {
    fileMap[file.fileName] = file;
  }

  const asRelativePath = (absolutePath: string) =>
    path.isAbsolute(absolutePath)
      ? path.relative(projectRoot, absolutePath)
      : absolutePath;

  const asAbsolutePath = (relativePath: string) =>
    path.isAbsolute(relativePath)
      ? relativePath
      : path.join(projectRoot, relativePath);

  const context: SearchContext = {
    errorCount: 0,
    program,
    service,
    checker,
    ts,
    sourceReferenceManager,
    addRouteTree: (route: RouteTree) => {
      apps.push(route);
    },
    getFile: (fileName: string) => {
      return fileMap[fileName];
    },
    getId: (fileName: string, location) => {
      return `${asRelativePath(fileName)}@${location}`;
    },
    asRelativePath,
    asAbsolutePath,
  };

  for (const sourceFile of files) {
    if (!sourceFile.isDeclarationFile) {
      ts.forEachChild(sourceFile, (node: TsNode) => {
        visit(node, sourceFile.fileName, context);
      });
    }
  }

  return {
    results: apps,
    errorCount: context.errorCount,
  };
}

function visit(node: TsNode, fileName: string, context: SearchContext) {
  const { ts, addRouteTree, checker, asRelativePath, getId, getFile } = context;
  if (ts.isVariableStatement(node)) {
    for (const declaration of node.declarationList.declarations) {
      // Check if the variable is of type Hono
      const type = checker.getTypeAtLocation(
        declaration.initializer || declaration,
      );
      const typeName = checker.typeToString(type);
      if ("intrinsicName" in type && type.intrinsicName === "error") {
        context.errorCount++;
        console.error("Error in type check");
        console.error("In: ", node.getSourceFile().fileName, node.kind);
        console.error("Node text:", node.getFullText());
        console.error("type information", type.getSymbol());
      }

      if (typeName.startsWith("Hono<")) {
        // TODO: use the type information to get the name of the hono instance
        // TODO: (edge case) handle reassignments of the same variable. It's possible reuse a variable for different hono instances
        const honoInstanceName = declaration.name.getText();

        const current: RouteTree = {
          type: "ROUTE_TREE",
          id: getId(fileName, declaration.name.getStart()),
          baseUrl: "",
          name: honoInstanceName,
          fileName: asRelativePath(node.getSourceFile().fileName),
          entries: [],
        };

        // Add route early
        addRouteTree(current);

        // TODO: add support for late initialization of the hono instance
        // What if people do something like:
        //
        // ``` ts
        // let app: Hono;
        // app = new Hono();
        // ```
        //
        // Or have some other kind of initialization:
        //
        // ``` ts
        // let app: Hono;
        // app = createApp();
        // ```

        if (
          declaration.initializer &&
          ts.isCallExpression(declaration.initializer)
        ) {
          handleInitializerCallExpression(
            declaration.initializer,
            current,
            context,
          );
        }

        const references = context.service
          .getReferencesAtPosition(fileName, declaration.name.getStart())
          .filter(
            (reference) =>
              reference.fileName === fileName &&
              reference.textSpan.start !== declaration.name.getStart(),
          );
        for (const entry of references) {
          followReference(current, entry, context);
        }
      }
    }
  }
}

function handleInitializerCallExpression(
  callExpression: TsCallExpression,
  routeTree: RouteTree,
  context: SearchContext,
) {
  const { ts, getFile, getId, asRelativePath } = context;
  const fileName = callExpression.getSourceFile().fileName;
  const references = context.service.findReferences(
    fileName,
    callExpression.getStart(),
  );
  const reference = references.find(
    (ref) => ref.definition.kind === ts.ScriptElementKind.functionElement,
  );
  const declarationFileName = reference.definition.fileName;
  const functionNode =
    reference &&
    findNodeAtPosition(
      ts,
      getFile(declarationFileName),
      reference.definition.textSpan.start,
    );
  if (
    functionNode?.parent &&
    ts.isFunctionDeclaration(functionNode.parent) &&
    functionNode.parent.body
  ) {
    const functionBody = functionNode.parent.body;
    // console.log('declarationFileName', declarationFileName, functionBody.getText())
    functionBody.forEachChild((child) => {
      visit(child, declarationFileName, context);
    });

    // Now find the return statements in the function body to construct the route tree reference
    const returnStatements = findReturnStatementsInFunction(
      functionNode.parent,
      context,
    );

    const variables = returnStatements.flatMap((returnStatement) =>
      analyzeReturnStatement(returnStatement, context),
    );

    for (const variable of variables) {
      routeTree.entries.push({
        type: "ROUTE_TREE_REFERENCE",
        targetId: getId(variable.getSourceFile().fileName, variable.getStart()),
        fileName: asRelativePath(variable.getSourceFile().fileName),
        name: variable.name.getText(),
        path: "/",
      });
    }
  }
}

function followReference(
  routeTree: RouteTree,
  reference: TsReferenceEntry,
  context: SearchContext,
) {
  const { getFile, ts } = context;

  const sourceFile = getFile(reference.fileName);
  if (!sourceFile) {
    console.warn("no file found", reference.fileName);
    return;
  }

  const node = findNodeAtPosition(ts, sourceFile, reference.textSpan.start);
  if (!node) {
    console.warn("no node found", reference.textSpan.start);
    return;
  }

  const accessExpression = node.parent;
  const callExpression = node.parent?.parent;
  if (
    accessExpression &&
    ts.isPropertyAccessExpression(accessExpression) &&
    callExpression &&
    ts.isCallExpression(callExpression)
  ) {
    const methodName = accessExpression.name.text;
    handleHonoMethodCall(callExpression, methodName, routeTree, context);
  }
}

function handleHonoMethodCall(
  callExpression: TsCallExpression,
  methodName: string,
  routeTree: RouteTree,
  context: SearchContext,
) {
  const { ts } = context;

  if (methodName === "route") {
    return handleRoute(callExpression, routeTree, context);
  }

  if (methodName === "use") {
    return handleUse(callExpression, routeTree, context);
  }

  if (methodName === "baseUrl") {
    if (ts.isStringLiteral(callExpression.arguments[0])) {
      routeTree.baseUrl = callExpression.arguments[0].text;
    }
  }

  if ([...HONO_HTTP_METHODS, "all", "use"].includes(methodName)) {
    const [firstArgument, ...args] = callExpression.arguments;
    const entry: RouteEntry = {
      type: "ROUTE_ENTRY",
      id: context.getId(
        callExpression.getSourceFile().fileName,
        callExpression.getStart(),
      ),
      method: methodName === "all" ? undefined : methodName,
      path: JSON.parse(firstArgument.getText()),
      sources: [],
    };

    // Add the tree node to the list of entries
    // Later the entry will be filled with source references
    routeTree.entries.push(entry);

    for (const arg of args) {
      if (ts.isArrowFunction(arg) || ts.isCallExpression(arg)) {
        const source = createSourceReferenceForNode(arg, context);
        if (source) {
          entry.sources.push(source);
        }
      }
    }
  }
}

function handleRoute(
  callExpression: TsCallExpression,
  routeTree: RouteTree,
  context: SearchContext,
) {
  const { ts, getFile, asRelativePath, getId } = context;

  // There should be 2 arguments
  const [firstArgument = undefined, appNode = undefined] =
    callExpression.arguments;

  if (!appNode) {
    return;
  }

  const path = ts.isStringLiteral(firstArgument) ? firstArgument.text : "";
  const SUPPORTED_VARIABLE_KINDS = [
    ts.ScriptElementKind.constElement,
    ts.ScriptElementKind.letElement,
    ts.ScriptElementKind.variableElement,
  ];
  const references = context.service.findReferences(
    appNode.getSourceFile().fileName,
    appNode.getStart(),
  );

  let target: TsVariableDeclaration | undefined;
  for (const referencedSymbol of references) {
    // TODO: investigate whether there are other cases we should support
    // Check if it's a variable like const, let or var
    if (SUPPORTED_VARIABLE_KINDS.includes(referencedSymbol.definition.kind)) {
      // If so, find the node
      const variableDeclarationChild = findNodeAtPosition(
        ts,
        getFile(referencedSymbol.definition.fileName),
        referencedSymbol.definition.textSpan.start,
      );

      // Access the parent & verify that's a variable declaration
      // As the node will point to the identifier and not the declaration
      if (
        variableDeclarationChild?.parent &&
        ts.isVariableDeclaration(variableDeclarationChild.parent)
      ) {
        target = variableDeclarationChild.parent;
        break;
      }
    }
  }

  if (!target) {
    return;
  }

  const filename = target.getSourceFile().fileName;
  routeTree.entries.push({
    type: "ROUTE_TREE_REFERENCE",
    targetId: getId(filename, target.getStart()),
    fileName: asRelativePath(filename),
    name: target.name.getText(),
    path,
  });
}

function extractPathFromUseArguments(
  callExpressionArgs: TsNodeArray<TsExpression>,
  context: SearchContext,
) {
  if (callExpressionArgs.length === 0) {
    return "/";
  }

  const { ts } = context;
  const [firstArgument] = callExpressionArgs;
  if (ts.isStringLiteral(firstArgument)) {
    return firstArgument.text;
  }

  return "/";
}

type PossibleMiddleware =
  | TsArrowFunction
  | TsCallExpression
  | TsFunctionDeclaration;
function isPossibleMiddleware(
  node: TsNode,
  context: SearchContext,
): node is PossibleMiddleware {
  const { ts } = context;
  return (
    ts.isArrowFunction(node) ||
    ts.isCallExpression(node) ||
    ts.isFunctionDeclaration(node)
  );
}

function extractAppsFromUseArguments(
  callExpressionArgs: TsNodeArray<TsExpression>,
  context: SearchContext,
) {
  return callExpressionArgs.filter((arg) => isPossibleMiddleware(arg, context));
}

function handleUse(
  callExpression: TsCallExpression,
  routeTree: RouteTree,
  context: SearchContext,
) {
  const path = extractPathFromUseArguments(callExpression.arguments, context);
  const middleware = extractAppsFromUseArguments(
    callExpression.arguments,
    context,
  );

  const entry: MiddlewareEntry = {
    id: context.getId(
      callExpression.getSourceFile().fileName,
      callExpression.getStart(),
    ),
    type: "MIDDLEWARE_ENTRY",
    path,
    sources: [],
  };

  routeTree.entries.push(entry);

  for (const arg of middleware) {
    const source = createSourceReferenceForNode(arg, context);
    if (source) {
      entry.sources.push(source);
    }
  }
}

function findReturnStatementsInFunction(
  node: TsFunctionDeclaration | TsFunctionExpression,
  context: SearchContext,
): TsReturnStatement[] {
  const { ts } = context;

  const returnStatements: TsReturnStatement[] = [];

  function visit(node: TsNode) {
    if (ts.isReturnStatement(node)) {
      returnStatements.push(node);
    }
    ts.forEachChild(node, visit);
  }

  if (node.body) {
    visit(node.body);
  }

  return returnStatements;
}

function analyzeReturnStatement(
  returnStatement: TsReturnStatement,
  context: SearchContext,
): TsVariableDeclaration[] {
  const { checker, ts } = context;
  const variables: TsVariableDeclaration[] = [];

  function visit(node: TsNode) {
    if (ts.isIdentifier(node)) {
      const symbol = checker.getSymbolAtLocation(node);
      const declaration = symbol?.declarations?.[0];
      // console.log('declaration', declaration && ts.SyntaxKind[declaration.kind])
      if (declaration && ts.isVariableDeclaration(declaration)) {
        variables.push(declaration);
      }
    }
    ts.forEachChild(node, visit);
  }

  if (returnStatement.expression) {
    visit(returnStatement.expression);
  }

  return variables;
}

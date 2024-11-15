import { ResourceManager } from "../ResourceManager";
import { logger } from "../logger";
import {
  HONO_HTTP_METHODS,
  type MiddlewareEntry,
  type ModuleReferenceId,
  type RouteEntry,
  type RouteTree,
  type RouteTreeReference,
  type SearchContext,
  type SourceReferenceId,
  type TsArrowFunction,
  type TsCallExpression,
  type TsExpression,
  type TsFunctionDeclaration,
  type TsFunctionExpression,
  type TsLanguageService,
  type TsNode,
  type TsNodeArray,
  type TsProgram,
  type TsReferenceEntry,
  type TsReturnStatement,
  type TsSourceFile,
  type TsSymbol,
  type TsType,
  type TsVariableDeclaration,
  isHonoMethod,
} from "../types";
import { createSourceReferenceForNode } from "./extractReferences";
import { findNodeAtPosition } from "./utils";

export function extractRouteTrees(
  service: TsLanguageService,
  program: TsProgram,
  ts: TsType,
  projectRoot: string,
): {
  errorCount?: number;
  resourceManager: ResourceManager;
} {
  // const now = performance.now();
  // const program = service.getProgram();
  // if (!program) {
  // throw new Error("Program not found");
  // }
  // logger.log('program', performance.now() - now)

  const resourceManager = new ResourceManager(projectRoot);
  const checker = program.getTypeChecker();

  const files = program.getSourceFiles();
  const fileMap: Record<string, TsSourceFile> = {};
  for (const file of files) {
    fileMap[file.fileName] = file;
  }

  const context: SearchContext = {
    errorCount: 0,
    program,
    service,
    checker,
    ts,
    resourceManager,
    getFile: (fileName: string) => {
      return program.getSourceFile(fileName);
    },
  };

  for (const sourceFile of files) {
    if (!sourceFile.isDeclarationFile) {
      ts.forEachChild(sourceFile, (node: TsNode) => {
        visit(node, sourceFile.fileName, context);
      });
    }
  }

  return {
    resourceManager,
    errorCount: context.errorCount,
  };
}

function visit(node: TsNode, fileName: string, context: SearchContext) {
  const { ts, checker, resourceManager, service } = context;
  if (!ts.isVariableStatement(node)) {
    return;
  }

  for (const declaration of node.declarationList.declarations) {
    // Check if the variable is of type Hono
    const type = checker.getTypeAtLocation(
      declaration.initializer || declaration,
    );

    if ("intrinsicName" in type && type.intrinsicName === "error") {
      context.errorCount++;
      logger.error("Error in type check");
      logger.error("In: ", node.getSourceFile().fileName, node.kind);
      logger.error("Node text:", node.getFullText());
      logger.error("type information", type.getSymbol());
    }

    const typeName = checker.typeToString(type);
    if (typeName.startsWith("Hono<")) {
      // TODO: use the type information to get the name of the hono instance
      // TODO: (edge case) handle reassignments of the same variable. It's possible reuse a variable for different hono instances
      const honoInstanceName = declaration.name.getText();
      const position = declaration.name.getStart();
      const params = {
        type: "ROUTE_TREE" as const,
        baseUrl: "",
        name: honoInstanceName,
        fileName: resourceManager.asRelativePath(node.getSourceFile().fileName),
        position,
        entries: [],
        modules: new Set<ModuleReferenceId>(),
        sources: new Set<SourceReferenceId>(),
      };

      const current = resourceManager.createRouteTree(params);

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

      const references = (
        service.getReferencesAtPosition(fileName, position) ?? []
      ).filter(
        (reference) =>
          reference.fileName === fileName &&
          reference.textSpan.start !== position,
      );
      for (const entry of references) {
        followReference(current, entry, context);
      }
    }
  }
}

function handleInitializerCallExpression(
  callExpression: TsCallExpression,
  routeTree: RouteTree,
  context: SearchContext,
) {
  const { ts, getFile, resourceManager, program } = context;
  const fileName = callExpression.getSourceFile().fileName;
  const references = context.service.findReferences(
    fileName,
    callExpression.getStart(),
  );
  const reference = references?.find(
    (ref) => ref.definition.kind === ts.ScriptElementKind.functionElement,
  );
  if (!reference) {
    logger.warn("no reference found for", callExpression.getText());
    return;
  }
  const declarationFileName = reference.definition.fileName;
  const targetSourceFile =
    getFile(declarationFileName) || program.getSourceFile(declarationFileName);
  const functionNode =
    targetSourceFile &&
    findNodeAtPosition(
      ts,
      targetSourceFile,
      reference.definition.textSpan.start,
    );
  if (
    functionNode?.parent &&
    ts.isFunctionDeclaration(functionNode.parent) &&
    functionNode.parent.body
  ) {
    const functionBody = functionNode.parent.body;
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
      const variableFileName = variable.getSourceFile().fileName;
      const variablePosition = variable.getStart();
      const params: Omit<RouteTreeReference, "id"> = {
        type: "ROUTE_TREE_REFERENCE",
        targetId: resourceManager.getId(
          "ROUTE_TREE",
          variableFileName,
          variablePosition,
        ),
        fileName: resourceManager.asRelativePath(variableFileName),
        position: variablePosition,
        name: variable.name.getText(),
        path: "/",
      };
      const { id } = resourceManager.createRouteTreeReference(params);
      routeTree.entries.push(id);
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
    logger.warn("no file found", reference.fileName);
    return;
  }

  const node = findNodeAtPosition(ts, sourceFile, reference.textSpan.start);
  if (!node) {
    logger.warn("no node found", reference.textSpan.start);
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
  const { ts, resourceManager } = context;

  if (methodName === "route") {
    return handleRoute(callExpression, routeTree, context);
  }

  if (methodName === "use") {
    return handleUse(callExpression, routeTree, context);
  }

  if (methodName === "baseUrl") {
    const [firstArgument] = callExpression.arguments;
    if (firstArgument && ts.isStringLiteral(firstArgument)) {
      routeTree.baseUrl = firstArgument.text;
    }
  }

  if ([...HONO_HTTP_METHODS, "all", "use"].includes(methodName)) {
    const [firstArgument, ...args] = callExpression.arguments;
    if (!firstArgument) {
      // No first argument for the hono.{method} call
      logger.warn("No first argument for", callExpression.getText());
      context.errorCount++;
      return;
    }

    const method = isHonoMethod(methodName) ? methodName : undefined;

    const params: Omit<RouteEntry, "id"> = {
      type: "ROUTE_ENTRY",
      fileName: callExpression.getSourceFile().fileName,
      position: callExpression.getStart(),
      method,
      path: JSON.parse(firstArgument.getText()),
      modules: new Set(),
      sources: new Set(),
    };

    const entry = resourceManager.createRouteEntry(params);

    // Add the tree node to the list of entries
    // Later the entry will be filled with source references
    routeTree.entries.push(entry.id);

    for (const arg of args) {
      if (ts.isArrowFunction(arg) || ts.isCallExpression(arg)) {
        const source = createSourceReferenceForNode(arg, context);
        if (source) {
          entry.sources.add(source.id);
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
  const { ts, resourceManager, checker } = context;

  // There should be 2 arguments
  const [firstArgument = undefined, appNode = undefined] =
    callExpression.arguments;

  if (!appNode) {
    return;
  }

  const path =
    firstArgument && ts.isStringLiteral(firstArgument)
      ? firstArgument.text
      : "";

  let target: TsVariableDeclaration | undefined;

  const symbol = checker.getSymbolAtLocation(appNode);
  const declaration = symbol?.declarations?.[0];

  if (declaration && ts.isVariableDeclaration(declaration)) {
    target = declaration;
  }
  if (!target) {
    if (symbol && isAlias(symbol, context)) {
      let alias = symbol;
      while (alias && isAlias(alias, context)) {
        alias = checker.getAliasedSymbol(symbol);
        if (
          alias.valueDeclaration &&
          ts.isVariableDeclaration(alias.valueDeclaration)
        ) {
          target = alias.valueDeclaration;
        }
      }
    }
  }

  if (!target) {
    logger.log("No target found for", appNode.getText());
    return;
  }

  const filename = target.getSourceFile().fileName;
  const position = target.getStart();
  const targetId = resourceManager.getId(
    "ROUTE_TREE" as const,
    filename,
    target.getStart(),
  );
  const params: Omit<RouteTreeReference, "id"> = {
    type: "ROUTE_TREE_REFERENCE",
    targetId,
    fileName: resourceManager.asRelativePath(filename),
    position,
    name: target.name.getText(),
    path,
  };
  const { id } = resourceManager.createRouteTreeReference(params);
  routeTree.entries.push(id);
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
  if (firstArgument && ts.isStringLiteral(firstArgument)) {
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
  const { resourceManager } = context;
  const path = extractPathFromUseArguments(callExpression.arguments, context);
  const middleware = extractAppsFromUseArguments(
    callExpression.arguments,
    context,
  );

  const params: Omit<MiddlewareEntry, "id"> = {
    type: "MIDDLEWARE_ENTRY",
    path,
    modules: new Set(),
    sources: new Set(),
    fileName: callExpression.getSourceFile().fileName,
    position: callExpression.getStart(),
  };

  const entry = resourceManager.createMiddlewareEntry(params);
  routeTree.entries.push(entry.id);

  for (const arg of middleware) {
    const source = createSourceReferenceForNode(arg, context);
    if (source) {
      entry.sources.add(source.id);
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
      // logger.log('declaration', declaration && ts.SyntaxKind[declaration.kind])
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

function isAlias(symbol: TsSymbol, context: SearchContext) {
  return symbol.flags === context.ts.SymbolFlags.Alias;
}

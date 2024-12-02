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
  type SourceReference,
  type SourceReferenceId,
  type TsArrowFunction,
  type TsCallExpression,
  type TsExpression,
  type TsFunctionDeclaration,
  type TsFunctionExpression,
  type TsLanguageService,
  type TsNode,
  type TsNodeArray,
  type TsPackageType,
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
  ts: TsPackageType,
  projectRoot: string,
): {
  errorCount?: number;
  resourceManager: ResourceManager;
} {
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
        visitToFindRouteTree(node, sourceFile.fileName, context);
      });
    }
  }

  return {
    resourceManager,
    errorCount: context.errorCount,
  };
}

function getTypeErrorDetails(type: TsType): string {
  const symbol = type.getSymbol();
  if (!symbol) {
    return "No symbol found for type";
  }
  const declarations = symbol.getDeclarations();
  if (!declarations || declarations.length === 0) {
    return "No declarations found for symbol";
  }
  return declarations
    .map((declaration) => {
      const sourceFile = declaration.getSourceFile();
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(
        declaration.getStart(),
      );
      return `Error in ${sourceFile.fileName} at ${line + 1}:${character + 1}`;
    })
    .join("\n");
}

function visitToFindRouteTree(
  node: TsNode,
  fileName: string,
  context: SearchContext,
) {
  const { ts, checker } = context;
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
      logger.info("Error in type check");
      const prettyLocation = node
        .getSourceFile()
        .getLineAndCharacterOfPosition(node.getStart());
      logger.info(
        `Location: /${node.getSourceFile().fileName}:${prettyLocation.line + 1}:${prettyLocation.character + 1}`,
      );
      logger.debug("Syntax kind:", ts.SyntaxKind[node.kind]);
      logger.debug("Type error details:", getTypeErrorDetails(type));
    }

    const typeName = checker.typeToString(type);
    if (typeName.startsWith("Hono<")) {
      handleHonoAppInstance(declaration, node, fileName, context);
    } else if (typeName.startsWith("OpenAPIHono<")) {
      handleOpenApiHonoInstance(declaration, node, fileName, context);
    }
  }
}

function handleOpenApiHonoInstance(
  declaration: TsVariableDeclaration,
  node: TsNode,
  fileName: string,
  context: SearchContext,
) {
  const { ts, resourceManager, service } = context;

  const honoInstanceName = declaration.name.getText();
  const position = declaration.name.getStart();
  const params = {
    type: "ROUTE_TREE" as const,
    baseUrl: "",
    name: honoInstanceName,
    fileName: resourceManager.asRelativePath(node.getSourceFile().fileName),
    position,
    entries: [],
    library: "zod-openapi" as const,
    modules: new Set<ModuleReferenceId>(),
    sources: new Set<SourceReferenceId>(),
  };

  const current = resourceManager.createRouteTree(params);
  if (declaration.initializer && ts.isCallExpression(declaration.initializer)) {
    handleInitializerCallExpression(declaration.initializer, current, context);
  }

  const references = (
    service.getReferencesAtPosition(fileName, position) ?? []
  ).filter(
    (reference) =>
      reference.fileName === fileName && reference.textSpan.start !== position,
  );

  for (const entry of references) {
    followReference(current, entry, context, handleOpenApiHonoMethodCall);
  }
}

function handleHonoAppInstance(
  declaration: TsVariableDeclaration,
  node: TsNode,
  fileName: string,
  context: SearchContext,
) {
  const { ts, resourceManager, service } = context;
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
    library: "hono" as const,
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

  if (declaration.initializer && ts.isCallExpression(declaration.initializer)) {
    handleInitializerCallExpression(declaration.initializer, current, context);
  }

  const references = (
    service.getReferencesAtPosition(fileName, position) ?? []
  ).filter(
    (reference) =>
      reference.fileName === fileName && reference.textSpan.start !== position,
  );
  for (const entry of references) {
    followReference(current, entry, context, handleHonoMethodCall);
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
      visitToFindRouteTree(child, declarationFileName, context);
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
  handleMethodCall: (
    callExpression: TsCallExpression,
    methodName: string,
    routeTree: RouteTree,
    context: SearchContext,
  ) => void,
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
    handleMethodCall(callExpression, methodName, routeTree, context);
  }
}
// function followHonoAppReference(
//   routeTree: RouteTree,
//   reference: TsReferenceEntry,
//   context: SearchContext,
// ) {
//   followReference(routeTree, reference, context, handleHonoMethodCall);
// }

function handleOpenApiHonoMethodCall(
  callExpression: TsCallExpression,
  methodName: string,
  routeTree: RouteTree,
  context: SearchContext,
) {
  const { ts, resourceManager } = context;
  if (methodName === "openapi") {
    const [firstArgument] = callExpression.arguments;
    if (!firstArgument) {
      return;
    }

    if (ts.isIdentifier(firstArgument)) {
      const symbol = context.checker.getSymbolAtLocation(firstArgument);
      const declaration = symbol?.valueDeclaration;
      if (declaration && ts.isVariableDeclaration(declaration)) {
        const initializer = declaration.initializer;
        if (!initializer || !ts.isCallExpression(initializer)) {
          return;
        }

        const {
          method,
          path,
          sourceReferencesIds = new Set(),
        } = getOpenApiRouteDetailsFromCallExpression(initializer, context);
        if (path) {
          const params: Omit<RouteEntry, "id"> = {
            type: "ROUTE_ENTRY",
            fileName: callExpression.getSourceFile().fileName,
            position: callExpression.getStart(),
            method: method && isHonoMethod(method) ? method : undefined,
            path,
            modules: new Set(),
            sources: sourceReferencesIds,
          };

          const entry = resourceManager.createRouteEntry(params);

          // Add the tree node to the list of entries
          // Later the entry will be filled with source references
          routeTree.entries.push(entry.id);
        }
      }
    } else if (ts.isCallExpression(firstArgument)) {
      const {
        method,
        path,
        sourceReferencesIds = new Set(),
      } = getOpenApiRouteDetailsFromCallExpression(firstArgument, context);
      if (path) {
        const params: Omit<RouteEntry, "id"> = {
          type: "ROUTE_ENTRY",
          fileName: callExpression.getSourceFile().fileName,
          position: callExpression.getStart(),
          method: method && isHonoMethod(method) ? method : undefined,
          path,
          modules: new Set(),
          sources: sourceReferencesIds,
        };

        const entry = resourceManager.createRouteEntry(params);

        // Add the tree node to the list of entries
        // Later the entry will be filled with source references
        routeTree.entries.push(entry.id);
      }
    } else {
      logger.warn(
        "Unsupported firstArgument",
        ts.SyntaxKind[firstArgument.kind],
      );
    }
  } else {
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
    let path = "";

    if (ts.isStringLiteral(firstArgument)) {
      path = firstArgument.text;
    } else if (ts.isTemplateLiteral(firstArgument)) {
      path = expandTemplateLiteral(firstArgument, context);
    }

    const params: Omit<RouteEntry, "id"> = {
      type: "ROUTE_ENTRY",
      fileName: callExpression.getSourceFile().fileName,
      position: callExpression.getStart(),
      method,
      path,
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

function expandTemplateLiteral(
  template: TsNode,
  context: SearchContext,
): string {
  const { ts } = context;
  let result = "";

  template.forEachChild((child) => {
    if (
      ts.isTemplateHead(child) ||
      ts.isTemplateMiddle(child) ||
      ts.isTemplateTail(child)
    ) {
      result += child.text;
    } else if (ts.isTemplateSpan(child)) {
      const expression = child.expression;
      const value = getExpressionValue(expression, context);
      result += value;
      result += child.literal.text;
    } else if (ts.isExpression(child)) {
      const value = getExpressionValue(child, context);
      result += value;
    }
  });

  return result;
}

function getExpressionValue(
  expression: TsNode,
  context: SearchContext,
): string {
  const { checker, ts } = context;
  let constantValue: string | number | undefined;
  if (
    ts.isPropertyAccessExpression(expression) ||
    ts.isElementAccessExpression(expression) ||
    ts.isEnumMember(expression)
  ) {
    constantValue = checker.getConstantValue(expression);
  }

  if (constantValue !== undefined) {
    return String(constantValue);
  }

  if (ts.isIdentifier(expression)) {
    const symbol = checker.getSymbolAtLocation(expression);
    if (symbol) {
      const declaration = symbol.valueDeclaration;
      if (declaration && ts.isVariableDeclaration(declaration)) {
        const initializer = declaration.initializer;
        if (initializer) {
          return getExpressionValue(initializer, context);
        }
      }
    }
  }
  if (ts.isStringLiteral(expression)) {
    return expression.text;
  }

  return expression.getText();
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

function getOpenApiRouteDetailsFromCallExpression(
  callExpression: TsCallExpression,
  context: SearchContext,
): {
  method?: string | undefined;
  path?: string | undefined;
  sourceReferencesIds?: Set<SourceReferenceId>;
} {
  const { ts } = context;

  let rootSourceReference: null | SourceReference = null;

  if (
    !ts.isIdentifier(callExpression.expression) ||
    callExpression.expression.text !== "createRoute"
  ) {
    logger.warn(
      "Unsupported call expression for open api route declaration",
      callExpression.getText(),
    );
    return {};
  }

  const [routeConfig] = callExpression.arguments;
  if (!routeConfig || !ts.isObjectLiteralExpression(routeConfig)) {
    logger.warn(
      "Unsupported route config parameter for open api route declaration",
      routeConfig?.getText(),
    );
    return {};
  }

  let method: string | undefined;
  let path: string | undefined;

  for (const property of routeConfig.properties) {
    if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name)) {
      continue;
    }

    const name = property.name.text;
    if (name === "method" && ts.isStringLiteral(property.initializer)) {
      method = property.initializer.text;
    } else if (name === "path" && ts.isStringLiteral(property.initializer)) {
      path = property.initializer.text;
    }
  }
  rootSourceReference = createSourceReferenceForNode(callExpression, context);

  let sourceReferencesIds: Set<SourceReferenceId>;
  if (rootSourceReference) {
    sourceReferencesIds = new Set([rootSourceReference.id]);
  } else {
    sourceReferencesIds = new Set();
  }

  return {
    method,
    path,
    sourceReferencesIds,
  };
}

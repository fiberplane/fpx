import { ResourceManager } from "../ResourceManager";
import {
  HONO_HTTP_METHODS,
  type MiddlewareEntry,
  type RouteEntry,
  type RouteTree,
  type RouteTreeReference,
  type SearchContext,
  type TreeResource,
  type TsArrowFunction,
  type TsCallExpression,
  type TsExpression,
  type TsFunctionDeclaration,
  type TsFunctionExpression,
  type TsLanguageService,
  type TsNode,
  type TsNodeArray,
  type TsReferenceEntry,
  type TsReturnStatement,
  type TsSourceFile,
  type TsSymbol,
  type TsType,
  type TsVariableDeclaration,
} from "../types";
import { createSourceReferenceForNode } from "./extractReferences";
import { findNodeAtPosition } from "./utils";

export function extractRouteTrees(
  service: TsLanguageService,
  ts: TsType,
  projectRoot: string,
): {
  errorCount?: number;
  resourceManager: ResourceManager;
} {
  const program = service.getProgram();
  if (!program) {
    throw new Error("Program not found");
  }

  const resourceManager = new ResourceManager(projectRoot);
  const checker = program.getTypeChecker();

  // const apps: Array<RouteTreeId> = [];
  const files = program.getSourceFiles();
  const fileMap: Record<string, TsSourceFile> = {};
  for (const file of files) {
    fileMap[file.fileName] = file;
  }

  const asRelativePath = (absolutePath: string) =>
    resourceManager.asRelativePath(absolutePath);

  const asAbsolutePath = (relativePath: string) =>
    resourceManager.asAbsolutePath(relativePath);

  const context: SearchContext = {
    errorCount: 0,
    program,
    service,
    checker,
    ts,
    resourceManager,
    getFile: (fileName: string) => {
      return fileMap[fileName];
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

  // const honoReference =
  // const moduleId = resourceManager.getId("MODULE_REFERENCE", "hono", "Hono");
  // const moduleReference = resourceManager.createModuleReference({
  //   type: "MODULE_REFERENCE",
  //   importPath: "hono",
  //   import: "Hono",
  //   name: "Hono",
  //   // version: "1.0.0",
  // });
  // resourceManager.addResource({
  //   id: resourceManager.getId("MODULE_REFERENCE", )
  // })

  return {
    resourceManager,
    errorCount: context.errorCount,
  };
}

function visit(node: TsNode, fileName: string, context: SearchContext) {
  const { ts, checker, asRelativePath, resourceManager, service } = context;
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

        const position = declaration.name.getStart();
        const params = {
          type: "ROUTE_TREE" as const,
          baseUrl: "",
          name: honoInstanceName,
          fileName: asRelativePath(node.getSourceFile().fileName),
          position,
          entries: [],
        };

        const current = resourceManager.createRouteTree(params);

        // Add route early
        // addRouteTree(current);

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
          // if (fileName.includes("src/app.ts")) {
          //   console.log('entry', entry, current.id)
          // }

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
  const { ts, getFile, asRelativePath, resourceManager, program } = context;
  const fileName = callExpression.getSourceFile().fileName;
  const references = context.service.findReferences(
    fileName,
    callExpression.getStart(),
  );
  const reference = references?.find(
    (ref) => ref.definition.kind === ts.ScriptElementKind.functionElement,
  );
  if (!reference) {
    console.warn("no reference found for", callExpression.getText());
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
      const variableFileName = variable.getSourceFile().fileName;
      const variablePosition = variable.getStart();
      const params: Omit<RouteTreeReference, "id"> = {
        type: "ROUTE_TREE_REFERENCE",
        targetId: resourceManager.getId(
          "ROUTE_TREE",
          variableFileName,
          variablePosition,
        ),
        fileName: asRelativePath(variableFileName),
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
  const { ts, resourceManager } = context;

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
    const params: Omit<RouteEntry, "id"> = {
      type: "ROUTE_ENTRY",
      fileName: callExpression.getSourceFile().fileName,
      position: callExpression.getStart(),
      method: methodName === "all" ? undefined : methodName,
      path: JSON.parse(firstArgument.getText()),
      modules: [],
      sources: [],
    };

    const entry = resourceManager.createRouteEntry(params);

    // Add the tree node to the list of entries
    // Later the entry will be filled with source references
    routeTree.entries.push(entry.id);

    for (const arg of args) {
      if (ts.isArrowFunction(arg) || ts.isCallExpression(arg)) {
        const source = createSourceReferenceForNode(arg, context);
        if (source) {
          entry.sources.push(source.id);
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
  const { ts, getFile, asRelativePath, resourceManager, checker, service } =
    context;

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
  const SUPPORTED_VARIABLE_KINDS = [
    ts.ScriptElementKind.constElement,
    ts.ScriptElementKind.letElement,
    ts.ScriptElementKind.variableElement,
  ];

  // checker.getSymbolAtLocation()
  // if (routeTree.id === "ROUTE_TREE:src/app.ts@785") {
  // console.log(appNode.getText(), 'referencedSymbol', referencedSymbol.references)
  // }

  // const references = service.findReferences(
  //   appNode.getSourceFile().fileName,
  //   appNode.getStart(),
  // );

  let target: TsVariableDeclaration | undefined;
  // const variableReference = references.find((ref) =>
  //   SUPPORTED_VARIABLE_KINDS.includes(ref.definition.kind),
  // );
  // if (variableReference) {
  //   const variableDeclarationChild = findNodeAtPosition(
  //     ts,
  //     getFile(variableReference.definition.fileName),
  //     variableReference.definition.textSpan.start,
  //   );

  //   // Access the parent & verify that's a variable declaration
  //   // As the node will point to the identifier and not the declaration
  //   if (
  //     variableDeclarationChild?.parent &&
  //     ts.isVariableDeclaration(variableDeclarationChild.parent)
  //   ) {
  //     target = variableDeclarationChild.parent;
  //   }
  // }

  const symbol = checker.getSymbolAtLocation(appNode);
  const declaration = symbol?.declarations?.[0];

  if (declaration && ts.isVariableDeclaration(declaration)) {
    target = declaration;
  }
  if (!target) {
    if (symbol && isAlias(symbol, context)) {
      let alias = symbol;
      while (alias && isAlias(alias, context)) {
        // console.log('alias', alias.flags)
        alias = checker.getAliasedSymbol(symbol);
        if (
          alias.valueDeclaration &&
          ts.isVariableDeclaration(alias.valueDeclaration)
        ) {
          // console.log('assigning', alias)
          // console.log('aliasedSymbolValue', ts.SyntaxKind[aliasedSymbol.valueDeclaration.kind])
          target = alias.valueDeclaration;
        }
      }
      // if ()
      // console.log('aliasDeclaration', aliasedSymbol.flags)
    }
    // console.log(isAlias, "no target found for", appNode.getText());
    // let currentAlias = checker.
  }
  // for (const referencedSymbol of references) {

  //   // if (referencedSymbol.definition.kind === ts.ScriptElementKind.alias) {

  //   //   const node = findNodeAtPosition(referencedSymbol.references[0].fileName
  //   // }

  //   // TODO: investigate whether there are other cases we should support
  //   // Check if it's a variable like const, let or var
  //   if (SUPPORTED_VARIABLE_KINDS.includes(referencedSymbol.definition.kind)) {
  //     // If so, find the node
  //   }
  // }

  // const modules: Array<ModuleReferenceId> = [];
  // if (!target && declaration) {
  //   const dependencyResult = getImportTypeDefinitionFileName(appNode, context);
  //   if (dependencyResult) {
  //     if (dependencyResult.isExternalLibrary) {
  //       const { id } = resourceManager.createModuleReference({
  //         type: "MODULE_REFERENCE",
  //         // location: dependencyResult.location,
  //         // isExternalLibrary: true,
  //         // fileName: asRelativePath(appNode.getSourceFile().fileName),
  //         // position: appNode.getStart(),
  //         importPath: dependencyResult.importPath,
  //         import: dependencyResult.import,
  //         name: dependencyResult.name,
  //         version: dependencyResult.version,
  //       });
  //       modules.push(id);
  //     } else {
  //       // console.log("local dependencyResult", dependencyResult);
  //       const nodeValue = getNodeValueForDependency(
  //         dependencyResult,
  //         context,
  //         declaration,
  //       );
  //       console.log(appNode.getText(), 'nodeValue', nodeValue)
  //       //   dependencyResult,
  //       //   context,
  //       //   declaration,
  //       // );
  //       // if (nodeValue) {
  //       //   const source = createSourceReferenceForNode(nodeValue, context);
  //       //   if (source) {
  //       //     modules.push(source.id);
  //       //   }
  //       // }
  //     }
  //   }
  //   // let destination: TsNode | undefined = declaration;
  //   // let current = declaration;
  //   // while (current) {
  //   //   if (ts.isImportClause(current)) {
  //   //     const importDeclaration = current.parent;
  //   //     const moduleSpecifier = importDeclaration.moduleSpecifier;
  //   //     if (ts.isStringLiteral(moduleSpecifier)) {
  //   //       const filename = moduleSpecifier.text;

  //   //       const targetFile = getFile(filename);
  //   //       if (targetFile) {
  //   //         const targetNode = findNodeAtPosition(ts, targetFile, moduleSpecifier.getStart());
  //   //         if (targetNode) {
  //   //           destination = targetNode;
  //   //           break;
  //   //         }
  //   //       }
  //   //     }
  //   //     // destination = current;
  //   //     // break;
  //   //   }
  //   // }
  // }
  // // more imports
  // console.log(
  //   routeTree.id,
  //   " declaration ",
  //   declaration && {
  //     kind: ts.SyntaxKind[declaration.kind],
  //     fileName: declaration.getSourceFile().fileName,
  //     position: declaration.getStart(),
  //   },
  //   "referenceKinds",
  //   references.map((ref) => {
  //     return {
  //       kind: ref.definition.kind,
  //       fileName: ref.definition.fileName,
  //       position: ref.definition.textSpan.start,
  //     };
  //   }),
  // );

  if (!target) {
    console.log("what? no target?", appNode.getText());
    return;
  }
  // console.log("it did work for", target.getText());

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
    fileName: asRelativePath(filename),
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
  const { resourceManager } = context;
  const path = extractPathFromUseArguments(callExpression.arguments, context);
  const middleware = extractAppsFromUseArguments(
    callExpression.arguments,
    context,
  );

  const params: Omit<MiddlewareEntry, "id"> = {
    type: "MIDDLEWARE_ENTRY",
    path,
    modules: [],
    sources: [],
    fileName: callExpression.getSourceFile().fileName,
    position: callExpression.getStart(),
  };

  const entry = resourceManager.createMiddlewareEntry(params);
  routeTree.entries.push(entry.id);

  for (const arg of middleware) {
    const source = createSourceReferenceForNode(arg, context);
    if (source) {
      entry.sources.push(source.id);
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

function isAlias(symbol: TsSymbol, context: SearchContext) {
  return symbol.flags === context.ts.SymbolFlags.Alias;
}

import type {
  ModuleReference,
  RouteEntry,
  RouteTree,
  SourceReference,
  TsArrowFunction,
  TsLanguageService,
  TsModuleResolutionHost,
  TsNode,
  TsProgram,
  TsReferenceEntry,
  TsSourceFile,
  TsType,
} from "./types";

export function findHonoRoutes(
  server: TsLanguageService,
  ts: TsType,
): {
  errorCount?: number;
  results: Array<RouteTree>;
} {
  const program = server.getProgram();
  if (!program) {
    throw new Error("Program not found");
  }

  let errorCount = 0;
  const checker = program.getTypeChecker();

  const apps: Array<RouteTree> = [];

  const files = program.getSourceFiles();
  const fileMap: Record<string, TsSourceFile> = {};
  for (const file of files) {
    fileMap[file.fileName] = file;
  }

  for (const sourceFile of files) {
    if (!sourceFile.isDeclarationFile) {
      ts.forEachChild(sourceFile, (file: TsSourceFile) =>
        visit(file, file.fileName),
      );
    }
  }

  function visit(node: TsNode, fileName: string) {
    if (ts.isVariableDeclaration(node) && node.initializer) {
      const type = checker.getTypeAtLocation(node.initializer);
      const typeName = checker.typeToString(type);
      if ("intrinsicName" in type && type.intrinsicName === "error") {
        errorCount++;
        console.error("Error in type check");
        console.error("In: ", node.getSourceFile().fileName, node.kind);
        console.error("Ndoe text:", node.getFullText());
        console.error("type information", type.getSymbol());
      }

      if (typeName.startsWith("Hono<")) {
        const honoInstanceName = node.name.getText();

        const current: RouteTree = {
          name: honoInstanceName,
          fileName: node.getSourceFile().fileName,
          entries: [],
        };

        findRoutes(current, node.parent.parent.parent);
        apps.push(current);
      }
    }

    ts.forEachChild(node, (child) => visit(child, fileName));
  }

  function findRoutes(routeTree: RouteTree, scope: TsNode) {
    const honoInstanceName = routeTree.name;
    function visit(node: TsNode) {
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression)
      ) {
        const methodName = node.expression.name.getText();
        const objectName = node.expression.expression.getText();

        if (
          objectName === honoInstanceName &&
          ["put", "get", "post", "all"].includes(methodName)
        ) {
          const [firstArgument, ...args] = node.arguments;
          const entry: RouteEntry = {
            method: methodName,
            path: JSON.parse(firstArgument.getText()),
            sources: [],
          };

          // Add the tree node to the list of entries
          // Later the entry will be filled with source references
          routeTree.entries.push(entry);

          for (const arg of args) {
            if (ts.isArrowFunction(arg)) {
              // const source = extractArrowFunctionContext(arg, ts);
              const source = extractReferencesFromArrowFunction(arg, program, ts);
              // console.log('arg.content', arg.getText())
              if (source) {
                entry.sources.push(...source);
              }
              // const sourceFile = arg.getSourceFile();
              // const position = sourceFile.getLineAndCharacterOfPosition(
              //   arg.getStart(),
              // );
              // entry.sources.push({
              //   character: position.character,
              //   line: position.line,
              //   fileName: sourceFile.fileName,
              //   content: arg.getText(),
              //   references: [],
              //   modules: {},
              // });
              // console.log('entry.sources', entry.sources)
            } else if (ts.isCallExpression(arg)) {
              const sourceFile = arg.getSourceFile();
              const position = sourceFile.getLineAndCharacterOfPosition(
                arg.getStart(),
              );
              const references = server.getReferencesAtPosition(
                sourceFile.fileName,
                arg.getStart(),
              );

              const source = {
                character: position.character,
                line: position.line,
                fileName: sourceFile.fileName,
                content: arg.getText(),
                references: [],
                modules: {},
              };
              // Immediately add the source to the entry
              // Though the source will be filled with references later
              entry.sources.push(source);

              let ref: TsReferenceEntry | undefined = references.shift();
              while (ref) {
                const currentFile = fileMap[ref.fileName];
                if (!currentFile) {
                  continue;
                }

                const refNode = findNodeAtPosition(
                  ts,
                  currentFile,
                  ref.textSpan.start,
                );
                const referencedModule = getImportTypeDefinitionFileName(
                  ts,
                  refNode,
                  program,
                );
                if (referencedModule) {
                  source.modules[referencedModule.name] = referencedModule;
                  break;
                }

                ref = references.shift();
              }
            }
          }
        }
      }

      ts.forEachChild(node, visit);
    }

    ts.forEachChild(scope, visit);
  }

  return {
    results: apps,
    errorCount,
  };
}

function createRootReferenceForArrowFunction(node: TsArrowFunction, ts: TsType): SourceReference {
  const sourceFile = node.getSourceFile();
  const position = sourceFile.getLineAndCharacterOfPosition(
    node.getStart(),
  );

  return {
    character: position.character,
    line: position.line,
    fileName: sourceFile.fileName,
    content: node.getText(),
    references: [],
    modules: {},
  }


  // return current;
}

function getImportTypeDefinitionFileName(
  ts: TsType,
  node: TsNode,
  program: TsProgram,
): ModuleReference | undefined {
  const checker = program.getTypeChecker();
  const symbol = checker.getSymbolAtLocation(node);

  const declarations = symbol?.getDeclarations();

  if (!declarations || declarations.length === 0) {
    return;
  }

  const declaration = declarations[0];
  const n = declaration.parent.parent;

  // Look for the import statement
  let nextSibling = n && getNextSibling(n);
  while (nextSibling && nextSibling.kind !== ts.SyntaxKind.StringLiteral) {
    nextSibling = getNextSibling(nextSibling);
  }

  if (nextSibling) {
    let text = nextSibling.getText();
    try {
      text = JSON.parse(text);
    } catch {
      // swallow error
    }
    const options = program.getCompilerOptions();
    const host: TsModuleResolutionHost = {
      fileExists: ts.sys.fileExists,
      readFile: ts.sys.readFile,
    };
    const result = ts.resolveModuleName(
      text,
      node.getSourceFile().fileName,
      options,
      host,
      undefined,
      undefined,
      undefined,
    );


    if (
      result.resolvedModule?.isExternalLibraryImport
    ) {
      return {
        import: node.getText(),
        importPath: text,
        name: result.resolvedModule.packageId.name,
        version: result.resolvedModule.packageId.version,
      };
    }
    if (text.startsWith("node:")) {
      return {
        import: node.getText(),
        importPath: text,
        name: text,
      }
    }
  }
}

function getNextSibling(node: TsNode): TsNode | undefined {
  const parent = node.parent;
  if (!parent) {
    // console.log('no parent');
    return undefined;
  }

  const children = parent.getChildren();
  for (let i = 0; i < children.length; i++) {
    if (children[i] === node && i + 1 < children.length) {
      return children[i + 1];
    }
  }

  return undefined;
}
function findNodeAtPosition(
  ts: TsType,
  sourceFile: TsSourceFile,
  position: number,
): TsNode | undefined {
  function find(node: TsNode): TsNode | undefined {
    if (position >= node.getStart() && position < node.getEnd()) {
      return ts.forEachChild(node, find) || node;
    }
    return undefined;
  }

  return find(sourceFile);
}

// console.log("node", node.kind, ts.SyntaxKind[node.kind], node.getText());
function inspectNode(node: TsNode, ts: TsType) {
  console.log("node", node.kind, ts.SyntaxKind[node.kind], node.getText());
  console.log("Inspecting node", {
    // isFunctionExpression: ts.isFunctionExpression(node),
    // isArrowFunction: ts.isArrowFunction(node),
    // isFunctionDeclaration: ts.isFunctionDeclaration(node),
    // isFunctionTypeNode: ts.isFunctionTypeNode(node),
    // isCallExpression: ts.isCallExpression(node),
    // isPropertyAccessExpression: ts.isPropertyAccessExpression(node),
    // isIdentifier: ts.isIdentifier(node),
    // isStringLiteral: ts.isStringLiteral(node),
    // isNumericLiteral: ts.isNumericLiteral(node),
    // isObjectLiteralExpression: ts.isObjectLiteralExpression(node),
    // isTypeLiteralNode: ts.isTypeLiteralNode(node),
    // isTypeReferenceNode: ts.isTypeReferenceNode(node),
    // isTypeQueryNode: ts.isTypeQueryNode(node),
    // isTypePredicateNode: ts.isTypePredicateNode(node),
    // // isTypeAssertion: ts.isTypeAssertion(node),
    // isAsExpression: ts.isAsExpression(node),
    // isNonNullExpression: ts.isNonNullExpression(node),
    // isNonNullChain: ts.isNonNullChain(node),
    // isParenthesizedExpression: ts.isParenthesizedExpression(node),
    // isSpreadElement: ts.isSpreadElement(node),
    // isShorthandPropertyAssignment: ts.isShorthandPropertyAssignment(node),
    // isPropertyAssignment: ts.isPropertyAssignment(node),
    // isPropertyDeclaration: ts.isPropertyDeclaration(node),
    // isPropertySignature: ts.isPropertySignature(node),
    // isAccessor: ts.isAccessor(node),
    isImportAttribute: ts.isImportAttribute(node),
    isImportAttributeName: ts.isImportAttributeName(node),
    isImportAttributes: ts.isImportAttributes(node),
    isImportClause: ts.isImportClause(node),
    isImportDeclaration: ts.isImportDeclaration(node),
    isImportEqualsDeclaration: ts.isImportEqualsDeclaration(node),
    isImportOrExportSpecifier: ts.isImportOrExportSpecifier(node),
    isImportSpecifier: ts.isImportSpecifier(node),
    isImportTypeAssertionContainer: ts.isImportTypeAssertionContainer(node),
    isImportTypeNode: ts.isImportTypeNode(node),
  });
}

// Extract references from the arrow function
function extractReferencesFromArrowFunction(
  arrowFunction: TsArrowFunction,
  program: TsProgram,
  ts: TsType,
): Array<SourceReference> {

  const rootReference = createRootReferenceForArrowFunction(arrowFunction, ts);
  const references: Array<SourceReference> = [
    rootReference,
  ];

  function visit(node: TsNode) {
    if (ts.isIdentifier(node)) {
      const dependency = getImportTypeDefinitionFileName(ts, node, program);
      if (dependency) {
        if (
          rootReference.modules[dependency.name] !== undefined
        ) {
          rootReference.modules[dependency.name].push(dependency)
        } else {
          rootReference.modules[dependency.name] = [dependency];
        }
        return;
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(arrowFunction);
  return references;
}

// Function to analyze the arrow function and its references
// function analyzeSource(filePath: string, program: TsProgram, ts: TsType) {
//   const sourceFile = program.getSourceFile(filePath);

//   if (!sourceFile) {
//     throw new Error(`Cannot find source file: ${filePath}`);
//   }

//   function findArrowFunctions(node: TsNode) {
//     if (ts.isArrowFunction(node)) {
//       const references = extractReferencesFromArrowFunction(node, sourceFile, program);
//       console.log(references);
//     }
//     ts.forEachChild(node, findArrowFunctions);
//   }

//   findArrowFunctions(sourceFile);
// }

import type {
  ModuleReference,
  RouteEntry,
  RouteTree,
  SourceReference,
  TsArrowFunction,
  TsFunctionDeclaration,
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
              const source = extractReferencesFromFunctionLike(
                arg,
                program,
                ts,
                server,
              );
              if (source) {
                entry.sources.push(...source);
              }
            } else if (ts.isCallExpression(arg)) {
              const sourceFile = arg.getSourceFile();
              const position = sourceFile.getLineAndCharacterOfPosition(
                arg.getStart(),
              );
              const references = server.getReferencesAtPosition(
                sourceFile.fileName,
                arg.getStart(),
              );

              const source: SourceReference = {
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
                const moduleResult = getImportTypeDefinitionFileName(
                  ts,
                  refNode,
                  program,
                );
                if (moduleResult) {
                  const { isExternalLibrary, location, ...dependency } =
                    moduleResult;
                  if (isExternalLibrary) {
                    addDependencyToSourceReference(dependency, source);
                  }

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

function createRootReferenceForFunctionLike(
  node: TsArrowFunction | TsFunctionDeclaration,
  ts: TsType,
): SourceReference {
  const sourceFile = node.getSourceFile();
  const position = sourceFile.getLineAndCharacterOfPosition(node.getStart());

  return {
    character: position.character,
    line: position.line,
    fileName: sourceFile.fileName,
    content: node.getText(),
    references: [],
    modules: {},
  };
}

function getImportTypeDefinitionFileName(
  ts: TsType,
  node: TsNode,
  program: TsProgram,
):
  | (ModuleReference & { isExternalLibrary: boolean; location: string })
  | undefined {
  const checker = program.getTypeChecker();
  const symbol = checker.getSymbolAtLocation(node);

  const declarations = symbol?.getDeclarations();
  if (!declarations || declarations.length === 0) {
    return;
  }

  const declaration = declarations[0];
  const declarationFileName = declaration.getSourceFile().fileName;
  const nodeFileName = node.getSourceFile().fileName;
  const compilerOptions = program.getCompilerOptions();
  const host: TsModuleResolutionHost = {
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
  };

  // Is the type coming from another file than the current file? Then it
  // probably comes from a type definition file (like
  // `@cloudflare/workers-types` and is specified in compilerOptions.type section
  // of the tsconfig
  if (nodeFileName !== declarationFileName) {
    // TODO: improve guessing of which module the import came from
    if (compilerOptions.types) {
      const type = compilerOptions.types.find((name) =>
        nodeFileName.indexOf(name),
      );
      if (type) {
        const result = ts.resolveModuleName(
          type,
          nodeFileName,
          compilerOptions,
          host,
        );
        if (result.resolvedModule.isExternalLibraryImport) {
          return {
            import: node.getText(),
            importPath: type,
            name: type,
            version: result.resolvedModule.packageId.version,
            isExternalLibrary: true,
            location: result.resolvedModule.resolvedFileName,
          };
        }
      }
    }
  }

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
    const result = ts.resolveModuleName(
      text,
      nodeFileName,
      compilerOptions,
      host,
    );

    if (result.resolvedModule?.isExternalLibraryImport) {
      return {
        import: node.getText(),
        importPath: text,
        name: result.resolvedModule.packageId.name,
        version: result.resolvedModule.packageId.version,
        isExternalLibrary: true,
        location: result.resolvedModule.resolvedFileName,
      };
    }
    if (text.startsWith("node:")) {
      return {
        import: node.getText(),
        importPath: text,
        name: text,
        isExternalLibrary: true,
        location: result.resolvedModule.resolvedFileName,
      };
    }

    return {
      import: node.getText(),
      importPath: text,
      name: text,
      isExternalLibrary: false,
      location: result.resolvedModule.resolvedFileName,
    };
    // console.log('fallback', result.resolvedModule)
  }
}

function getNextSibling(node: TsNode): TsNode | undefined {
  const parent = node.parent;
  if (!parent) {
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

function addDependencyToSourceReference(
  dependency: ModuleReference,
  sourceReference: SourceReference,
) {
  if (!sourceReference.modules[dependency.name]) {
    sourceReference.modules[dependency.name] = [dependency];
    return;
  }

  sourceReference.modules[dependency.name].push(dependency);
}

// Extract references from the arrow function
function extractReferencesFromFunctionLike(
  arrowFunction: TsArrowFunction | TsFunctionDeclaration,
  program: TsProgram,
  ts: TsType,
  server: TsLanguageService,
): Array<SourceReference> {
  const rootReference = createRootReferenceForFunctionLike(arrowFunction, ts);
  const references: Array<SourceReference> = [rootReference];

  function visit(node: TsNode) {
    // if (ts.isCallExpression(node)) {
    //   if (node.getText() === "getUser()") {
    //     console.log('call expression yes!', node.getText(), node.getChildCount())
    //     for (let index = 0; index < node.getChildCount(); index++) {
    //       // const element = array[index];
    //       const child = node.getChildAt(index);
    //       console.log('child', child.getText(), child.kind, ts.SyntaxKind[child.kind])

    //     }
    //     // node.forEachChild((child) => {
    //     // });
    //   } else {
    //     console.log("other", node.getText())
    //   }
    //   return;
    // }
    if (ts.isIdentifier(node)) {
      const dependencyResult = getImportTypeDefinitionFileName(
        ts,
        node,
        program,
      );
      if (dependencyResult) {
        const { isExternalLibrary, location, ...dependency } = dependencyResult;
        if (isExternalLibrary) {
          // Add dependency to the root reference
          addDependencyToSourceReference(dependency, rootReference);
          // } else {
          //   console.log("!!!", dependency);
          return;
        }
      }

      const checker = program.getTypeChecker();
      const symbol = checker.getSymbolAtLocation(node);

      const declarations = symbol?.getDeclarations();
      if (!declarations || declarations.length === 0) {
        return;
      }

      const declaration = declarations[0];
      const declSourceFile = declaration.getSourceFile();
      const declarationFileName = declSourceFile.fileName;
      const nodeFileName = node.getSourceFile().fileName;
      if (node.getText() === "getUser") {
        if (dependencyResult) {
          // const host: TsModuleResolutionHost = {
          //   fileExists: ts.sys.fileExists,
          //   readFile: ts.sys.readFile,
          // };

          // const resolve = ts.resolveModuleName(dependencyResult.importPath, nodeFileName, program.getCompilerOptions(), host);
          // console.log('getUser dependency result', dependencyResult)

          const references = server.getReferencesAtPosition(
            declSourceFile.fileName,
            declaration.getStart(),
          );
          const reference = references.find(
            (ref) => ref.fileName === dependencyResult.location,
          );
          if (reference) {
            const refFile = program.getSourceFile(reference.fileName);
            const refNode = findNodeAtPosition(
              ts,
              refFile,
              reference.textSpan.start,
            );
            const symbol = checker.getSymbolAtLocation(refNode);
            const declarations = symbol?.getDeclarations();
            if (declarations?.length === 1) {
              console.log("reference", declarations[0].getText());
              const declaration = declarations[0];
              const nodeValue = ts.isVariableDeclaration(declaration)
                ? declaration.initializer
                : declaration;
              if (
                ts.isFunctionDeclaration(nodeValue) ||
                ts.isArrowFunction(nodeValue)
              ) {
                console.log("!!!", nodeValue);
                rootReference.references.push(
                  ...extractReferencesFromFunctionLike(
                    nodeValue,
                    program,
                    ts,
                    server,
                  ),
                );
              }
            }
          }
          // console.log("reference", reference);
        }
        // console.log('references', references)

        // const position = declSourceFile.getLineAndCharacterOfPosition(declaration.getStart())
        // const lineStart = declSourceFile.getLineStarts()[position.line];
        // const lineEnd = declSourceFile.getLineStarts()[position.line + 1];
        // const line = declSourceFile.getText().substring(lineStart, lineEnd);
        // console.log("declaration", line)
      }
      // if (nodeFileName !== declarationFileName) {
      //   console.log('other file declaration', node.getText(), nodeFileName, declarationFileName)
      // }
      // }
    }
    ts.forEachChild(node, visit);
  }

  visit(arrowFunction);
  return references;
}

import { inspect, parseArgs } from "node:util";
import type { RouteEntry, RouteTree, TsLanguageService, TsLineAndCharacter, TsNode, TsProgram, TsReferenceEntry, TsSourceFile, TsStringLiteral, TsType } from "./types";
import { isArrowFunction, isImportAttribute } from "typescript";

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

  // 
  const files = program.getSourceFiles();
  const fileMap: Record<string, TsSourceFile> = {}
  for (const file of files) {
    fileMap[file.fileName] = file;
  }

  for (const sourceFile of files) {
    if (!sourceFile.isDeclarationFile) {
      ts.forEachChild(sourceFile, (file: TsSourceFile) => visit(file, file.fileName));
    }
  }

  function visit(node: TsNode, fileName: string) {
    if (ts.isVariableDeclaration(node) && node.initializer) {
      const type = checker.getTypeAtLocation(node.initializer);
      const typeName = checker.typeToString(type);
      if ("intrinsicName" in type && type.intrinsicName === "error") {
        errorCount++;
        console.error("Error in type check");
        console.debug("In: ", node.getSourceFile().fileName);
        console.debug("Ndoe text:", node.getFullText());

        console.log("type information", type.getSymbol());
      }

      if (typeName.startsWith("Hono<")) {
        const honoInstanceName = node.name.getText();
        // console.log(`Found Hono instance: ${honoInstanceName}`);
        // console.log("parent", node.parent.getText())
        // console.log("parent.parent", node.parent.parent.getText())
        // console.log("parent.parent.parent", node.parent.parent.parent.getText())
        const current: RouteTree = {
          name: honoInstanceName,
          fileName: node.getSourceFile().fileName,
          entries: [],
        };

        // server.getReferencesAtPosition(fileName, arg.getStart());
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
              // console.log('arrowww')
              const sourceFile = arg.getSourceFile();
              const position = sourceFile.getLineAndCharacterOfPosition(arg.getStart());
              entry.sources.push({
                character: position.character,
                line: position.line,
                fileName: sourceFile.fileName,
                content: arg.getText(),
              });
              // console.log('entry.sources', entry.sources)
            }
            else if (ts.isCallExpression(arg)) {
              const sourceFile = arg.getSourceFile();
              const position = sourceFile.getLineAndCharacterOfPosition(arg.getStart());
              // entry.sources.push({
              //   character: position.character,
              //   line: position.line,
              //   fileName: sourceFile.fileName,
              //   content: arg.getText(),
              // });
              // const sourceFile = arg.getSourceFile();
              const references = server.getReferencesAtPosition(sourceFile.fileName, arg.getStart());
              //   const position = sourceFile.getLineAndCharacterOfPosition(arg.getStart());
              // const isImported = references.find((ref) => {
              //   return ref.fileName.indexOf("/node_modules/") !== -1;
              // });


              // console.log('isImported', isImported, references);
              //   // ts.isImportClause


              //   // let node: TsNode | undefined;
              //   // let
              let attributeNameInfo: undefined | {
                ref: TsReferenceEntry,
                node: TsNode,
              }

              for (const ref of references) {
                if (ref.fileName.indexOf("/node_modules/") === -1) {

                  const currentFile = fileMap[ref.fileName] || program.getSourceFile(ref.fileName);
                  if (!currentFile) {
                    continue;
                  }
                  const position2 = currentFile.getLineAndCharacterOfPosition(ref.textSpan.start);
                  const node = findNodeAtPosition(ts, currentFile, position2);
                  const definitionFileName = getImportTypeDefinitionFileName(ts, node, program);

                  entry.sources.push({
                    character: position.character,
                    line: position.line,
                    fileName: sourceFile.fileName,
                    content: `${definitionFileName}
                    ${arg.getText()}`,
                  });

                  console.log('definitionFileName', definitionFileName, ref)
                  break;
                }
              }

              //   // if (attributeNameInfo) {
              //   //   console.log('importAttributeName', attributeNameInfo.node.parent.getText(), attributeNameInfo.ref);
              //   // }
            }
          }
          // console.log("Arguments", node.arguments.length, node.arguments);
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

function getImportTypeDefinitionFileName(ts: TsType, node: TsNode, program: TsProgram): string | undefined {
  const checker = program.getTypeChecker();
  const symbol = checker.getSymbolAtLocation(node);

  if (symbol) {
    const declarations = symbol.getDeclarations();
    if (declarations && declarations.length > 0) {
      const declaration = declarations[0];
      const sourceFile = declaration.getSourceFile();
      const n = declaration.parent.parent.parent;
      return n.getText();
      // let nextSibling = getNextSibling(n);
      // while (nextSibling && nextSibling.kind !== ts.SyntaxKind.StringLiteral) {
      //   console.log('kind', nextSibling.kind, nextSibling.getText())
      //   nextSibling = getNextSibling(nextSibling);
      // }
      // if (nextSibling) {
      //   console.log('found it', nextSibling.getText())
      //   return nextSibling.getText();
      //   // program.
      //   // const options = ts.
      //   // const something = checker.resolveName(nextSibling.getText(), nextSibling, ts.SymbolFlags., true);
      //   // ts.resolveModuleName(nextSibling.getText(), sourceFile.fileName, {}, {}, undefined, undefined, undefined, undefined);
      //   // console.log('something', something)
      //   // , n, ts.SymbolFlags.Value, ts.SymbolFlags.Value, ts.SymbolFlags.Value, ts.SymbolFlags.Value);
      // }

      // let nextSibling = getNextSibling(n);
      // nextSibling = getNextSibling(nextSibling);
      // checker.resolveName()
      // console.log("-------------------", nextSibling.getFullText())
      // inspectNode(nextSibling, ts)
      // console.log("-------------------")
      // console.log(
      //   sourceFile.getLineAndCharacterOfPosition(declaration.getStart()),
      //   declaration.parent.getFullText())
      // declaration
      // console.log('declaration', declaration.getText(),
      // declarations.length
      // , sourceFile.fileName
      // );
      return sourceFile.fileName;
    }
  }

  return undefined;
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
      // console.log('found it')
      return children[i + 1];
    }
  }
  // console.log('fallback');

  return undefined;
}
function findNodeAtPosition(ts: TsType, sourceFile: TsSourceFile, lineAndCharacter: TsLineAndCharacter): TsNode | undefined {
  const position = sourceFile.getPositionOfLineAndCharacter(lineAndCharacter.line, lineAndCharacter.character);

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

// function findImportSource(ts: TsType, sourceFile: TsSourceFile, importName: string): string | undefined {
//   let importSource: string | undefined;

//   function visit(node: TsNode) {
//     if (ts.isImportDeclaration(node)) {
//       const importClause = node.importClause;
//       if (importClause && ts.isNamedImports(importClause.namedBindings)) {
//         for (const element of importClause.namedBindings.elements) {
//           if (element.name.getText() === importName) {
//             importSource = (node.moduleSpecifier as TsStringLiteral).text;
//             return;
//           }
//         }
//       }
//     }
//     ts.forEachChild(node, visit);
//   }

//   visit(sourceFile);
//   return importSource;
// }

// Example usage within your existing code
// function findRoutes(routeTree: RouteTree, scope: TsNode) {
//   const honoInstanceName = routeTree.name;

//   function visit(node: TsNode) {
//     if (
//       ts.isCallExpression(node) &&
//       ts.isPropertyAccessExpression(node.expression)
//     ) {
//       const methodName = node.expression.name.getText();
//       const objectName = node.expression.expression.getText();

//       if (
//         objectName === honoInstanceName &&
//         ["put", "get", "post", "all"].includes(methodName)
//       ) {
//         const [firstArgument, ...args] = node.arguments;
//         const entry: RouteEntry = {
//           method: methodName,
//           path: JSON.parse(firstArgument.getText()),
//           sources: [],
//         };

//         // Add the tree node to the list of entries
//         // Later the entry will be filled with source references
//         routeTree.entries.push(entry);

//         for (const arg of args) {
//           if (ts.isArrowFunction(arg)) {
//             const sourceFile = arg.getSourceFile();
//             const position = sourceFile.getLineAndCharacterOfPosition(arg.getStart());
//             entry.sources.push({
//               character: position.character,
//               line: position.line,
//               fileName: sourceFile.fileName,
//               content: arg.getText(),
//             });
//           } else if (ts.isCallExpression(arg)) {
//             console.log("Call expression", arg.getText());
//             const sourceFile = arg.getSourceFile();
//             const references = server.getReferencesAtPosition(sourceFile.fileName, arg.getStart());
//             console.log('references', references)
//             for (const ref of references) {
//               ref
//             }
//           }
//         }
//       }
//     }

//     ts.forEachChild(node, visit);
//   }

//   ts.forEachChild(scope, visit);
// }

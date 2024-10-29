// import {
//   HONO_HTTP_METHODS,
//   type SearchContext,
//   type RouteEntry,
//   type RouteTree,
//   type SourceReference,
//   type TsCallExpression,
//   type TsLanguageService,
//   type TsNode,
//   type TsReferenceEntry,
//   type TsSourceFile,
//   type TsType,
//   type TsVariableDeclaration,
// } from "../types";
// import { SourceReferenceManager } from "./SourceReferenceManager";
// import { createSourceReferenceForNode } from "./extractReferences";
// import { findNodeAtPosition, getImportTypeDefinitionFileName } from "./utils";

export { extractRouteTrees } from "./extractRouteTrees";
// function handleCallExpression(
//   arg: TsCallExpression,
//   entry: RouteEntry,
//   context: SearchContext,
// ) {
//   const { service, sourceReferenceManager, getFile, ts } = context;
//   const sourceFile = arg.getSourceFile();
//   const position = sourceFile.getLineAndCharacterOfPosition(arg.getStart());
//   const references: Array<TsReferenceEntry> | undefined =
//     service.getReferencesAtPosition(sourceFile.fileName, arg.getStart()) || [];

//   const source: SourceReference = {
//     character: position.character,
//     line: position.line,
//     fileName: sourceFile.fileName,
//     content: arg.getText(),
//     references: [],
//     modules: {},
//   };

//   sourceReferenceManager.addReference(source.fileName, arg.getStart(), source);

//   // Immediately add the source to the entry
//   // Though the source will be filled with references later
//   entry.sources.push(source);

//   let ref: TsReferenceEntry | undefined = references.shift();
//   while (ref) {
//     const currentFile = getFile(ref.fileName);
//     if (!currentFile) {
//       console.log("no file found", ref.fileName);
//       continue;
//     }

//     const refNode = findNodeAtPosition(ts, currentFile, ref.textSpan.start);
//     const moduleResult = getImportTypeDefinitionFileName(refNode, context);

//     if (moduleResult) {
//       const { isExternalLibrary, location, ...dependency } = moduleResult;
//       if (isExternalLibrary) {
//         context.sourceReferenceManager.addModuleToReference(
//           sourceFile.fileName,
//           arg.getStart(),
//           dependency,
//         );
//       }

//       break;
//     }

//     ref = references.shift();
//   }
// }

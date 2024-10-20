import {
  // assert,
  expect,
  test,
  // vi
} from "vitest";
// import * as fs from "node:fs";
// import { findHonoLikeSymbols, setup } from "../src";
// import { Watcher } from "../src/monitor";
import * as path from "node:path";
import { setupMonitoring } from "src";
// import { getTSServer, logger } from "../src";
// import type { MessageConnection } from "vscode-jsonrpc";
// import type {
//   // CodeLensParams,
//   Definition,
//   DidOpenTextDocumentParams,
//   Location,
//   TextDocumentItem,
// } from "vscode-languageserver-protocol";
// import {
//   codeLens,
//   getTsSourceDefinition,
//   getWordAtLocation,
//   // sendDefinitionRequest,
//   sendReferencesRequest,
// } from "./utils";

test("single file", async () => {
  const location = path.join(__dirname, "./test-case/single");
  const { watcher, findHonoRoutes, teardown } = setupMonitoring(location);
  try {
    watcher.start();

    expect(findHonoRoutes()).toMatchSnapshot()

  } finally {
    teardown();
  }
});

test("multiple files", async () => {
  const location = path.join(__dirname, "./test-case/multiple");
  const { watcher, findHonoRoutes, teardown } = setupMonitoring(location);
  try {
    watcher.start();

    expect(findHonoRoutes()).toMatchSnapshot()
  } finally {
    teardown();
  }
});

test("module imports", async () => {
  const location = path.join(__dirname, "./test-case/module-imports");
  const { watcher, findHonoRoutes, teardown } = setupMonitoring(location);
  try {
    watcher.start();

    expect(findHonoRoutes()).toMatchSnapshot()
  } finally {
    teardown();
  }
});

// test("goose quotes", async () => {
//   const location = path.resolve(path.join(__dirname, "../../api"));
//   const { watcher, findHonoRoutes, teardown } = setupMonitoring(location);
//   try {
//     watcher.start();

//     const result = findHonoRoutes()
//     console.log('result', JSON.stringify(result, null, 2))
//     expect(result).toMatchSnapshot()
//   } finally {
//     teardown();
//   }

// });

//   const location = path.join(__dirname, "./test-case/multiple");
//   const { connection, tsServer } = await getTSServer(location);

//   const otherFilePath = path.resolve(location, "other.ts");
//   await didOpen(connection, otherFilePath, location);
//   const indexFilePath = path.resolve(location, "index.ts");
//   await didOpen(connection, indexFilePath, location);
//   console.log("wait before codelens")
//   await new Promise((resolve) => setTimeout(resolve, 1000));

//   await codeLens(connection, indexFilePath);
//   await new Promise((resolve) => setTimeout(resolve, 100));
//   const definition = await checkFile(connection, indexFilePath, location);
//   if (Array.isArray(definition)) {
//     printResults(definition);
//   } else if (definition) {
//     printElement(definition);
//   }
//   tsServer.kill();
// });

// function printElement(element: Location) {
//   const content = data[element.uri]?.text;
//   console.log("element", element.uri, !!content);
//   if (!content) {
//     return;
//   }

//   const word = getWordAtLocation(content, element.range.start);
//   console.log("element", element.uri, word, element.range.start);
// }

// function printResults(locations: Array<Location>) {
//   // console.log("location", locations.length);
//   for (const result of locations) {
//     printElement(result);
//   }
// }

// async function checkFile(
//   connection: MessageConnection,
//   filePath: string,
//   root: string,
// ) {
//   // const fileUri = `file://${filePath.replace(root, "")}`;
//   const fileUri = `file://${filePath}`;
//   const position = {
//     line: 0,
//     character: 9,
//   };

//   const document = data[fileUri];
//   const content = document.text;
//   const word = getWordAtLocation(content, position);

//   console.debug(`looking for \`${word}\` in ${fileUri}`);
//   // return await sendReferencesRequest(connection, fileUri, position);
//   // return await sendReferencesRequest(connection, fileUri, position);
//   return getTsSourceDefinition(connection, fileUri, position);
// }

// const data: Record<string, TextDocumentItem> = {};

// function didOpen(
//   connection: MessageConnection,
//   location: string,
//   root: string,
// ) {
//   const content = fs.readFileSync(location, "utf-8");
//   // const fileUri = `file://${location.replace(root, "")}`;
//   const fileUri = `file://${location}`;
//   data[fileUri] = {
//     uri: fileUri,
//     languageId: "typescript",
//     version: 1,
//     text: content,
//   };

//   const params: DidOpenTextDocumentParams = {
//     textDocument: data[fileUri],
//   };

//   return connection.sendNotification("textDocument/didOpen", params);
// }

// // function makeCodeLensRequest(connection: MessageConnection, fileUri: string) {
// //   const params: CodeLensParams = {
// //     textDocument: {
// //       uri: fileUri,
// //     },

// //   }
// //   return connection.sendRequest("textDocument/codeLens", params);
// // }

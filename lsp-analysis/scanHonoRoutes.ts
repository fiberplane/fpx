// scanHonoRoutes.ts
import * as bundledTs from 'typescript';
import * as path from 'node:path';
import relative from "resolve";

const relativeResolve = relative.sync;
// Alias some exported typescript types
type TsType = typeof bundledTs;
type TsLanguageService = bundledTs.LanguageService
type TsNode = bundledTs.Node;
type TsLanguageServiceHost = bundledTs.LanguageServiceHost;

type RouteTree = {
  name: string,
  fileName: string,
  entries: RouteEntry[],
}

type RouteEntry = {
  method: string,
  path: string,
}

import { Watcher } from "./src";
import { createRequire } from 'node:module';

async function go() {
  const projectRoot = path.resolve(path.join(process.cwd(), "../api"));
  // const projectRoot = path.resolve(path.join(process.cwd(), "test/test-case/simple"));
  // console.log("Analyzing location: ", projectRoot);
  const ts: TsType = getTsLib(projectRoot);

  // Only watch the src directory (if it exists)
  const possibleLocation = path.resolve(path.join(projectRoot, "src"));
  const location = (ts.sys.directoryExists(possibleLocation)) ? possibleLocation : projectRoot;
  const watcher = new Watcher(location);

  const fileMap: Record<
    string,
    {
      version: number;
      content: string;
    }
  > = {};

  function getFileInfo(fileName: string) {
    return fileMap[fileName];
  }

  function getFileNames() {
    return Object.keys(fileMap)
  }

  const server = startServer({
    getFileInfo,
    getFileNames,
    location: projectRoot,
    ts,
  })

  watcher.on("fileAdded", (event) => {
    fileMap[event.payload.fileName] = {
      version: 0,
      content: event.payload.content,
    };
    server.getProgram()?.getSourceFile(event.payload.fileName);
  });

  watcher.on("fileUpdated", (event) => {
    fileMap[event.payload.fileName] = {
      version: fileMap[event.payload.fileName].version + 1,
      content: event.payload.changes[0].text,
    };
  });

  watcher.on("fileRemoved", (event) => {
    delete fileMap[event.payload.fileName];
  });

  watcher.start();

  // performance.mark("first");
  const { results, errorCount, shutdown } = findHonoRoutes(server, ts);

  console.log("errorCount", errorCount);
  console.log(JSON.stringify(results, null, 2));
}
go();

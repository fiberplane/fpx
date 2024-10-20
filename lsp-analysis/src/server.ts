import { createRequire } from "node:module";
import * as bundledTs from 'typescript';
import type { TsLanguageServiceHost, TsType } from "./types";
import relative from "resolve";
import path from "node:path";
import { isSubpath } from "./utils"
const relativeResolve = relative.sync;

const require = createRequire(import.meta.url);

function getOptions(location: string, ts: TsType) {

  const configPath = ts.findConfigFile(
    location,
    ts.sys.fileExists,
    "tsconfig.json",
  );
  if (!configPath) {
    throw new Error("Could not find a valid 'tsconfig.json'.");
  }
  const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
  const { options } = ts.parseJsonConfigFileContent(
    config,
    ts.sys,
    location,
  );

  if (options.types) {
    options.types = options.types.map((type) => {
      try {
        const resolved = relativeResolve(`@types/${type}`, { basedir: location });
        return require(resolved);
      } catch (error) {
        try {
          const resolved = relativeResolve(type, { basedir: location, preserveSymlinks: true });
          return require(resolved);
        } catch (error) {
          console.warn("Unable to resolve type", type, error);
          return type;
        }
        // const resolved = relativeResolve(type, { basedir: location });
        // return require(resolved);
        // console.warn("Unable to resolve type", type, error);
        // return type;
      }
    });
  }

  if (ts === bundledTs) {
    options.typeRoots = [
      path.resolve(
        path.join(location, "node_modules/@types")
      ),
      path.resolve(
        path.join(location, "node_modules")
      )
    ];
  }

  return options;
}

export function getTsLib(projectRoot: string) {
  try {
    const tsPath = relativeResolve('typescript', { basedir: projectRoot });
    return require(tsPath);
  } catch (error) {
    console.warn("Unable resolve typescript package", error)
    console.log(`Using bundled in typescript (version ${bundledTs.version})`)
    return bundledTs;
  }
}

export function startServer(params: {
  ts: TsType;
  location: string;
  getFileInfo: (fileName: string) => undefined | { version: number, content: string };
  getFileNames: () => Array<string>;
}) {
  const {
    ts,
    location,
    getFileInfo,
    getFileNames,
  } = params;
  const options = getOptions(location, ts);

  const host: TsLanguageServiceHost = {
    fileExists: (fileName) => {
      if (isSubpath(location, fileName)) {
        return getFileInfo(fileName) !== undefined;
      }
      // console.log('fileExists', fileName)

      return ts.sys.fileExists(fileName);
    },
    getCurrentDirectory: () => location,
    getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
    getNewLine: () => "\n",
    getCompilationSettings() {
      return options;
    },
    getScriptFileNames: getFileNames,
    getScriptVersion: (fileName) => {
      return getFileInfo(fileName)?.version.toString();
    },
    getScriptSnapshot: (fileName) => {
      if (isSubpath(location, fileName)) {
        const info = getFileInfo(fileName)
        if (info) {
          return ts.ScriptSnapshot.fromString(info.content);
        }

        return undefined;
      }

      const sourceText = ts.sys.readFile(fileName)
      if (sourceText !== undefined) {
        return ts.ScriptSnapshot.fromString(sourceText);
      }

      return undefined;
    },
    readFile: ts.sys.readFile,
    useCaseSensitiveFileNames: () => true,
    writeFile: ts.sys.writeFile,
  };

  const server = ts.createLanguageService(host, ts.createDocumentRegistry());

  return server;
}

import { createRequire } from "node:module";
import relative from "resolve";
import * as bundledTs from "typescript";
import type { TsCompilerOptions, TsLanguageServiceHost, TsType } from "./types";
const relativeResolve = relative.sync;

export function getOptions(location: string, ts: TsType): TsCompilerOptions {
  const configPath = ts.findConfigFile(
    location,
    ts.sys.fileExists,
    "tsconfig.json",
  );

  if (!configPath) {
    throw new Error("Could not find a valid 'tsconfig.json'.");
  }
  const { config, error } = ts.readConfigFile(configPath, ts.sys.readFile);
  if (error) {
    console.error("Error parsing tsconfig", error.messageText);
  }
  const { options } = ts.parseJsonConfigFileContent(config, ts.sys, location);
  if (!options.baseUrl) {
    options.baseUrl = location;
  }

  // if (options.types) {
  //   console.log('got me some types', options.types);
  //   options.types = options.types.map((type) => {
  //     // return `${location}/node_modules/${type}`;
  //     try {
  //       const resolved = relativeResolve(`@types/${type}`, { basedir: location });
  //       return require(resolved);
  //     } catch (error) {
  //       try {
  //         const resolved = relativeResolve(type, { basedir: location, preserveSymlinks: true });
  //         return require(resolved);
  //       } catch (error) {
  //         console.warn("Unable to resolve type", type, error);
  //         return type;
  //       }
  //       // const resolved = relativeResolve(type, { basedir: location });
  //       // return require(resolved);
  //       // console.warn("Unable to resolve type", type, error);
  //       // return type;
  //     }
  //   });
  //   // options.types.map((type) => {
  //   //   returnts.resolveModuleName(type, configPath, options, ts.sys);
  //   // });
  // }
  return options;
}

export function getTsLib(projectRoot: string) {
  const require = createRequire(projectRoot);
  try {
    const tsPath = relativeResolve("typescript", { basedir: projectRoot });
    return require(tsPath);
  } catch (error) {
    console.warn("Unable resolve typescript package", error);
    console.log(`Using bundled in typescript (version ${bundledTs.version})`);
    return bundledTs;
  }
}

export function startServer(params: {
  ts: TsType;
  location: string;
  getFileInfo: (
    fileName: string,
  ) => undefined | { version: number; content: string };
  getFileNames: () => Array<string>;
}) {
  const { ts, location, getFileInfo, getFileNames } = params;
  const options = getOptions(location, ts);

  const host: TsLanguageServiceHost = {
    fileExists: (fileName) => {
      const exists =
        getFileInfo(fileName) !== undefined || ts.sys.fileExists(fileName);
      return exists;
    },
    getCurrentDirectory: () => location,
    getDefaultLibFileName: (options) => {
      return ts.getDefaultLibFilePath(options);
    },
    directoryExists: (directoryName) => {
      return ts.sys.directoryExists(directoryName);
    },
    getNewLine: () => "\n",
    getCompilationSettings() {
      return options;
    },
    getScriptFileNames: getFileNames,
    getScriptVersion: (fileName) => {
      return getFileInfo(fileName)?.version.toString() ?? "0";
    },
    getScriptSnapshot: (fileName) => {
      const info = getFileInfo(fileName);
      if (info) {
        return ts.ScriptSnapshot.fromString(info.content);
      }

      const sourceText = ts.sys.readFile(fileName);
      if (sourceText !== undefined) {
        return ts.ScriptSnapshot.fromString(sourceText);
      }
    },
    readFile: ts.sys.readFile,
    useCaseSensitiveFileNames: () => true,
    writeFile: ts.sys.writeFile,
  };

  return ts.createLanguageService(host, ts.createDocumentRegistry());
}

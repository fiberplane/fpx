import { createRequire } from "node:module";
import * as bundledTs from 'typescript';
import type { TsCompilerOptions, TsLanguageServiceHost, TsType } from "./types";
import relative from "resolve";
import path from "node:path";
import { isSubpath } from "./utils"
const relativeResolve = relative.sync;

const require = createRequire(import.meta.url);

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
  const { options } = ts.parseJsonConfigFileContent(
    config,
    ts.sys,
    location,
  );
  if (!options.baseUrl) {
    options.baseUrl = location;
  }
  // if (!options.rootDir) {
  //   options.rootDir = "./src";
  // }

  if (options.types) {
    // console.log("types", JSON.stringify(options, null, 2))
    // options.types = options.types.map((type) => {
    //   // return `${location}/node_modules/${type}`;
    //   try {
    //     const resolved = relativeResolve(`@types/${type}`, { basedir: location });
    //     return require(resolved);
    //   } catch (error) {
    //     try {
    //       const resolved = relativeResolve(type, { basedir: location, preserveSymlinks: true });
    //       return require(resolved);
    //     } catch (error) {
    //       console.warn("Unable to resolve type", type, error);
    //       return type;
    //     }
    //     // const resolved = relativeResolve(type, { basedir: location });
    //     // return require(resolved);
    //     // console.warn("Unable to resolve type", type, error);
    //     // return type;
    //   }
    // });
  }
  // throw new Error("Boom");
  // if (ts === bundledTs) {
  // options.typeRoots = [
  //   path.resolve(
  //     path.join(location, "node_modules/@types")
  //   ),
  //   path.resolve(
  //     path.join(location, "node_modules")
  //   )
  // ];
  // }

  // console.log(ts.getDefaultLibFilePath(options));
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
  console.log('location:', location)
  const host: TsLanguageServiceHost = {
    fileExists: (fileName) => {
      const exists = getFileInfo(fileName) !== undefined || ts.sys.fileExists(fileName)
      return exists;
    },

    // resolveModuleNameLiterals: (
    //   moduleLiterals: ReadonlyArray<bundledTs.StringLiteralLike>,
    //   containingFile: string,
    //   redirectedReference: bundledTs.ResolvedProjectReference | undefined,
    //   options: bundledTs.CompilerOptions,
    //   containingSourceFile: bundledTs.SourceFile,
    //   reusedNames: readonly bundledTs.StringLiteralLike[] | undefined
    // ): bundledTs.ResolvedModuleWithFailedLookupLocations[] => {
    //   // ts.sys.resol
    //   // return [];
    //   return [...moduleLiterals].map((moduleName) => {
    //     const resolved = ts.resolveModuleName(
    //       moduleName,
    //       containingFile,
    //       options,
    //       {
    //         fileExists: ts.sys.fileExists,
    //         readFile: ts.sys.readFile,
    //       },
    //     );

    //     return resolved.resolvedModule?.resolvedFileName;
    //   });
    // },
    // resolveModuleNames
    // getCurrentDirectory: () => location,
    getCurrentDirectory: () => location,
    getDefaultLibFileName: (options) => {
      // console.log('get default lib name', options);
      return ts.getDefaultLibFilePath(options)
    },
    directoryExists: (directoryName) => {
      // console.log('directory exists?', directoryName, ts.sys.directoryExists(directoryName))
      return ts.sys.directoryExists(directoryName);
    },
    getNewLine: () => "\n",
    getCompilationSettings() {
      return options;
    },
    getScriptFileNames: getFileNames,
    getScriptVersion: (fileName) => {
      return getFileInfo(fileName)?.version.toString();
    },
    getScriptSnapshot: (fileName) => {
      const info = getFileInfo(fileName)
      if (info) {
        return ts.ScriptSnapshot.fromString(info.content);
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

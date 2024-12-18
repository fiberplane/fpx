import { createRequire } from "node:module";
import relative from "resolve";
import * as bundledTs from "typescript";
import { logger } from "./logger";
import type {
  ConfigFileContent,
  TsCompilerOptions,
  TsISnapShot,
  TsLanguageServiceHost,
  TsPackageType,
} from "./types";

const relativeResolve = relative.sync;

export function getParsedTsConfig(
  location: string,
  ts: TsPackageType,
): ConfigFileContent {
  const configPath = ts.findConfigFile(
    location,
    ts.sys.fileExists,
    "tsconfig.json",
  );

  if (configPath) {
    const { config, error } = ts.readConfigFile(configPath, ts.sys.readFile);
    if (error) {
      logger.error("Error parsing tsconfig", error.messageText);
    }

    return {
      ...ts.parseJsonConfigFileContent(config, ts.sys, location),
      configPath,
    };
  }
  logger.warn("Could not find a 'tsconfig.json'.");
  return {
    options: ts.getDefaultCompilerOptions(),
  };
}

export function getOptions(
  location: string,
  ts: TsPackageType,
): TsCompilerOptions {
  const { options } = getParsedTsConfig(location, ts);
  if (!options.baseUrl) {
    options.baseUrl = location;
  }

  return options;
}

/**
 * Find the typescript library to use
 *
 * Uses this project's typescript version if no typescript package is found in the project
 */
export function getTsLib(projectRoot: string) {
  const require = createRequire(projectRoot);
  try {
    const tsPath = relativeResolve("typescript", { basedir: projectRoot });
    return require(tsPath);
  } catch (error) {
    logger.warn("Unable resolve typescript package", error);
    logger.log(`Using bundled in typescript (version ${bundledTs.version})`);
    return bundledTs;
  }
}

/**
 * Starts the typescript language service
 */
export function startServer(params: {
  directoryExists: (directory: string) => boolean;
  fileExists: (fileName: string) => boolean;
  getFileInfo: (fileName: string) =>
    | undefined
    | {
        version: number;
        content: string;
        snapshot: TsISnapShot;
      };
  getFileNames: () => Array<string>;
  getScriptSnapshot: (fileName: string) => TsISnapShot | undefined;
  location: string;
  readFile: (fileName: string) => string | undefined;
  ts: TsPackageType;
}) {
  const {
    directoryExists,
    fileExists,
    getFileInfo,
    getFileNames,
    getScriptSnapshot,
    location,
    readFile,
    ts,
  } = params;
  const options = getOptions(location, ts);

  const host: TsLanguageServiceHost = {
    // fileExists: ts.sys.fileExists,
    fileExists,
    getCurrentDirectory: () => location,
    getDefaultLibFileName: (options) => {
      return ts.getDefaultLibFilePath(options);
    },
    // directoryExists: ts.sys.directoryExists,
    directoryExists,
    getNewLine: () => "\n",
    getCompilationSettings() {
      return options;
    },
    getScriptFileNames: getFileNames,
    getScriptVersion: (fileName) => {
      return getFileInfo(fileName)?.version.toString() ?? "0";
    },
    getScriptSnapshot,
    readFile,
    useCaseSensitiveFileNames: () => true,
    writeFile: ts.sys.writeFile,
  };

  return ts.createLanguageService(host, ts.createDocumentRegistry());
}

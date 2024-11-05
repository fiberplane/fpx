import { createRequire } from "node:module";
import relative from "resolve";
import * as bundledTs from "typescript";
const relativeResolve = relative.sync;
const require = createRequire(import.meta.url);
export function getOptions(location, ts) {
    const configPath = ts.findConfigFile(location, ts.sys.fileExists, "tsconfig.json");
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
    return options;
}
export function getTsLib(projectRoot) {
    try {
        const tsPath = relativeResolve("typescript", { basedir: projectRoot });
        return require(tsPath);
    }
    catch (error) {
        console.warn("Unable resolve typescript package", error);
        console.log(`Using bundled in typescript (version ${bundledTs.version})`);
        return bundledTs;
    }
}
export function startServer(params) {
    const { ts, location, getFileInfo, getFileNames } = params;
    const options = getOptions(location, ts);
    console.log("location:", location);
    const host = {
        fileExists: (fileName) => {
            const exists = getFileInfo(fileName) !== undefined || ts.sys.fileExists(fileName);
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

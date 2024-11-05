import path from "node:path";
import { extractRouteTrees } from "./routeTrees";
import { getTsLib, startServer } from "./server";
import { Watcher } from "./watcher";
export function setupMonitoring(projectRoot) {
    const ts = getTsLib(projectRoot);
    // Only watch the src directory (if it exists)
    const possibleLocation = path.resolve(path.join(projectRoot, "src"));
    const location = ts.sys.directoryExists(possibleLocation)
        ? possibleLocation
        : projectRoot;
    const watcher = new Watcher(location);
    const fileMap = {};
    function getFileInfo(fileName) {
        return fileMap[fileName];
    }
    function getFileNames() {
        return Object.keys(fileMap);
    }
    const server = startServer({
        getFileInfo,
        getFileNames,
        location: projectRoot,
        ts,
    });
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
    return {
        watcher,
        findHonoRoutes: () => extractRouteTrees(server, ts, projectRoot),
        teardown: () => {
            watcher.teardown();
            server.dispose();
        },
    };
}

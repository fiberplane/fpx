import { EventEmitter } from "node:events";
import * as fs from "node:fs";
import * as path from "node:path";
import { watch } from "chokidar";
export class Watcher extends EventEmitter {
    folderPath;
    fileVersions = {};
    watcher = null;
    constructor(folderPath) {
        super();
        this.folderPath = path.normalize(folderPath);
    }
    start() {
        this.initFileVersions(this.getAllTsFiles(this.folderPath));
        this.initializeWatcher();
    }
    // Initialize file versions for existing files
    initFileVersions(fileNames) {
        for (const fileName of fileNames) {
            this.addFile(fileName);
        }
    }
    // Recursively get all .ts and .tsx files from a directory
    getAllTsFiles(folderPath) {
        const tsFiles = [];
        function getFilesFromDir(dir) {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    getFilesFromDir(fullPath);
                }
                else if (entry.isFile() &&
                    (fullPath.endsWith(".ts") || fullPath.endsWith(".tsx"))) {
                    tsFiles.push(fullPath);
                }
            }
        }
        getFilesFromDir(folderPath);
        return tsFiles;
    }
    // Initialize the file system watcher
    initializeWatcher() {
        this.watcher = watch([this.folderPath]);
        this.watcher.on("add", (fileName) => this.addFile(fileName));
        this.watcher.on("change", (fileName) => this.updateFile(fileName));
        this.watcher.on("unlink", (fileName) => this.removeFile(fileName));
    }
    // Add a new file to the language service
    addFile(fileName) {
        if (!fileName.endsWith(".ts") && !fileName.endsWith(".tsx")) {
            return;
        }
        const content = fs.readFileSync(fileName, "utf-8");
        this.fileVersions[fileName] = { version: 0, content };
        const event = {
            type: "fileAdded",
            payload: {
                fileName,
                content,
            },
        };
        this.emit(event.type, event);
    }
    // Remove a file from the language service
    removeFile(fileName) {
        if (!fileName.endsWith(".ts") && !fileName.endsWith(".tsx")) {
            return;
        }
        delete this.fileVersions[fileName];
        this.emit("fileRemoved", {
            type: "fileRemoved",
            payload: {
                fileName,
            },
        });
    }
    // Update a file's content and version (when modified)
    updateFile(fileName) {
        if (!fileName.endsWith(".ts") && !fileName.endsWith(".tsx")) {
            return;
        }
        if (this.fileVersions[fileName]) {
            const content = fs.readFileSync(fileName, "utf-8");
            this.fileVersions[fileName].version++;
            this.fileVersions[fileName].content = content;
            const change = {
                text: content,
            };
            this.emit("fileUpdated", {
                type: "fileUpdated",
                payload: {
                    fileName,
                    changes: [change],
                },
            });
        }
    }
    // Public method to stop the watcher and the language service
    teardown() {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
        }
    }
}

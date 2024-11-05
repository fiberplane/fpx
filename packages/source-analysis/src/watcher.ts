import { EventEmitter } from "node:events";
import * as fs from "node:fs";
import * as path from "node:path";
import { type FSWatcher, watch } from "chokidar";
import type { MapLike } from "typescript";
import type { TextDocumentContentChangeEvent } from "./types";

type FileAddedEvent = {
  type: "fileAdded";
  payload: {
    fileName: string;
    content: string;
  };
};

type FileRemovedEvent = {
  type: "fileRemoved";
  payload: {
    fileName: string;
  };
};

type FileUpdatedEvent = {
  type: "fileUpdated";
  payload: {
    fileName: string;
    changes: Array<TextDocumentContentChangeEvent>;
  };
};

type FileEvents = {
  fileAdded: [FileAddedEvent];
  fileRemoved: [FileRemovedEvent];
  fileUpdated: [FileUpdatedEvent];
};

export class Watcher extends EventEmitter<FileEvents> {
  private folderPath: string;
  private fileVersions: MapLike<{ version: number; content: string }> = {};
  private watcher: FSWatcher | null = null;
  constructor(folderPath: string) {
    super();
    this.folderPath = path.normalize(folderPath);
  }

  public start() {
    this.initFileVersions(this.getAllTsFiles(this.folderPath));
    this.initializeWatcher();
  }

  // Initialize file versions for existing files
  private initFileVersions(fileNames: string[]) {
    for (const fileName of fileNames) {
      this.addFile(fileName);
    }
  }

  // Recursively get all .ts and .tsx files from a directory
  private getAllTsFiles(folderPath: string): string[] {
    const tsFiles: string[] = [];

    function getFilesFromDir(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          getFilesFromDir(fullPath);
        } else if (
          entry.isFile() &&
          (fullPath.endsWith(".ts") || fullPath.endsWith(".tsx"))
        ) {
          tsFiles.push(fullPath);
        }
      }
    }

    getFilesFromDir(folderPath);
    return tsFiles;
  }

  // Initialize the file system watcher
  private initializeWatcher() {
    this.watcher = watch([this.folderPath]);
    this.watcher.on("add", (fileName) => this.addFile(fileName));
    this.watcher.on("change", (fileName) => this.updateFile(fileName));
    this.watcher.on("unlink", (fileName) => this.removeFile(fileName));
  }

  // Add a new file to the language service
  private addFile(fileName: string) {
    if (!fileName.endsWith(".ts") && !fileName.endsWith(".tsx")) {
      return;
    }

    const content = fs.readFileSync(fileName, "utf-8");
    this.fileVersions[fileName] = { version: 0, content };
    const event: FileEvents["fileAdded"][0] = {
      type: "fileAdded" as const,
      payload: {
        fileName,
        content,
      },
    };

    this.emit(event.type, event);
  }

  // Remove a file from the language service
  private removeFile(fileName: string) {
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
  private updateFile(fileName: string) {
    if (!fileName.endsWith(".ts") && !fileName.endsWith(".tsx")) {
      return;
    }

    if (this.fileVersions[fileName]) {
      const content = fs.readFileSync(fileName, "utf-8");

      this.fileVersions[fileName].version++;
      this.fileVersions[fileName].content = content;

      const change: TextDocumentContentChangeEvent = {
        text: content,
      };

      this.emit("fileUpdated", {
        type: "fileUpdated" as const,
        payload: {
          fileName,
          changes: [change],
        },
      });
    }
  }

  // Public method to stop the watcher and the language service
  public teardown() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}

import { EventEmitter } from "node:events";
import * as fs from "node:fs";
import { type FSWatcher, watch } from "chokidar";
import type { TextDocumentContentChangeEvent } from "./types";

export type FileAddedEvent = {
  type: "fileAdded";
  payload: {
    fileName: string;
    content: string;
  };
};

export type FileRemovedEvent = {
  type: "fileRemoved";
  payload: {
    fileName: string;
  };
};

export type FileUpdatedEvent = {
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

export class FileWatcher extends EventEmitter<FileEvents> {
  public readonly locations: Array<string>;
  private knownFileNames = new Set<string>();
  private watcher: FSWatcher | null = null;

  constructor(locations: Array<string>) {
    super();
    this.locations = locations;
  }

  /**
   * Start the file watcher 
   * 
   * It resolves when all files have been added
   */
  public async start() {
    await this.initializeWatcher();
  }

  // Initialize the file system watcher
  private async initializeWatcher() {
    const watcher = watch(this.locations);
    this.watcher = watcher;

    // Wait for ready event
    const ready = new Promise<void>((r) => {
      const readyHandler = () => {
        watcher.off("ready", readyHandler);
        r();
      };

      watcher.on("ready", readyHandler);
    });

    this.watcher.on("add", (fileName) => this.addFile(fileName));
    this.watcher.on("change", (fileName) => this.updateFile(fileName));
    this.watcher.on("unlink", (fileName) => this.removeFile(fileName));
    await ready;
  }

  // Add a new file to the language service
  private async addFile(fileName: string) {
    if (!fileName.endsWith(".ts") && !fileName.endsWith(".tsx")) {
      return;
    }

    const content = await fs.promises.readFile(fileName, "utf-8");
    this.knownFileNames.add(fileName);

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

    this.knownFileNames.delete(fileName);

    this.emit("fileRemoved", {
      type: "fileRemoved",
      payload: {
        fileName,
      },
    });
  }

  // Update a file's content and version (when modified)
  private async updateFile(fileName: string) {
    if (!fileName.endsWith(".ts") && !fileName.endsWith(".tsx")) {
      return;
    }

    if (this.knownFileNames.has(fileName)) {
      const content = await fs.promises.readFile(fileName, "utf-8");

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

  public get knownFileNamesArray() {
    return Array.from(this.knownFileNames);
  }

  // Public method to stop the watcher and the language service
  public stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}

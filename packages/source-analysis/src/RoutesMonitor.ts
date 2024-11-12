import { EventEmitter } from "node:events";
import path from "node:path";
import {
  type FileRemovedEvent,
  type FileUpdatedEvent,
  FileWatcher,
} from "./FileWatcher";
import { RoutesResult } from "./RoutesResult";
import { analyze } from "./analyze";
import { extractRouteTrees } from "./routeTrees";
import { getTsLib, startServer } from "./service";
import type { TsISnapShot, TsLanguageService, TsType } from "./types";

type AnalysisStarted = {
  type: "analysisStarted";
};

type AnalysisCompleted = {
  type: "analysisCompleted";
  payload: AnalysisCompletedPayload;
};

type AnalysisCompletedPayload =
  | {
      success: true;
      factory: RoutesResult;
    }
  | {
      success: false;
      error: string;
    };

type AnalysisEvents = {
  analysisCompleted: [AnalysisCompleted];
  analysisStarted: [AnalysisStarted];
};

export class RoutesMonitor extends EventEmitter<AnalysisEvents> {
  // Cache last known successful result
  private _lastSuccessfulResult: RoutesResult | null = null;

  // Root directory of the project
  public readonly projectRoot: string;

  // Whether the monitor is running
  private _isRunning = false;

  // Whether to automatically create the routes result
  public autoCreateResult = true;
  private ts: TsType;
  private service: TsLanguageService | null = null;

  public readonly fileWatcher: FileWatcher;
  private fileMap: Record<
    string,
    {
      version: number;
      content: string;
      snapshot: TsISnapShot;
    }
  > = {};

  private debouncedUpdateRoutesResult: () => void;

  constructor(projectRoot: string) {
    super();
    this.projectRoot = projectRoot;

    // Only watch the src directory (if it exists)
    const possibleLocation = path.resolve(path.join(projectRoot, "src"));
    this.ts = getTsLib(this.projectRoot);

    const location = this.ts.sys.directoryExists(possibleLocation)
      ? possibleLocation
      : projectRoot;
    this.fileWatcher = new FileWatcher(location);

    this.debouncedUpdateRoutesResult = debounce(() => {
      try {
        this.updateRoutesResult();
      } catch (e) {
        console.error("Error while updating factory", e);
      }
    }, 5);
  }

  public async start() {
    if (this.isRunning) {
      return;
    }

    this.service = startServer({
      getFileInfo: (fileName) => this.getFileInfo(fileName),
      getFileNames: () => this.getFileNames(),
      location: this.projectRoot,
      ts: this.ts,
    });

    this.addEventListenersToFileWatcher();
    await this.fileWatcher.start();

    this._isRunning = true;
  }

  public updateRoutesResult() {
    if (!this.isRunning) {
      throw new Error("Monitor not running");
    }

    this.emit("analysisStarted", { type: "analysisStarted" });
    const result = this.findHonoRoutes();
    if (result.errorCount) {
      console.warn(
        `${result.errorCount} error(s) found while analyzing routes`,
      );
    }

    // Find root route
    const root = analyze(result.resourceManager.getResources());

    if (!root) {
      this.emit("analysisCompleted", {
        type: "analysisCompleted",
        payload: {
          success: false,
          error: "No root route found",
        },
      });

      throw new Error("No root route found");
    }

    const factory = new RoutesResult(result.resourceManager);
    factory.rootId = root.id;

    this._lastSuccessfulResult = factory;
    this.emit("analysisCompleted", {
      type: "analysisCompleted",
      payload: {
        success: true,
        factory,
      },
    });
    return factory;
  }

  private addEventListenersToFileWatcher() {
    this.fileWatcher.on("fileAdded", (event) => {
      this.fileMap[event.payload.fileName] = {
        version: 0,
        content: event.payload.content,
        snapshot: this.ts.ScriptSnapshot.fromString(event.payload.content),
      };

      if (!this.service) {
        console.warn(
          "Monitor added before service was initialized",
          event.payload.fileName,
        );
        return;
      }

      this.service.getProgram()?.getSourceFile(event.payload.fileName);

      if (this.autoCreateResult) {
        this.debouncedUpdateRoutesResult();
      }
    });

    this.fileWatcher.on("fileUpdated", (event: FileUpdatedEvent) => {
      const current = this.fileMap[event.payload.fileName];
      if (!current) {
        console.warn(
          "Watcher::File updated that wasn't added",
          event.payload.fileName,
        );
        return;
      }
      const content = event.payload.changes[0]?.text ?? "";

      this.fileMap[event.payload.fileName] = {
        version: current.version + 1,
        content,
        snapshot: this.ts.ScriptSnapshot.fromString(content),
      };
      if (this.autoCreateResult) {
        this.debouncedUpdateRoutesResult();
      }
    });

    this.fileWatcher.on("fileRemoved", (event: FileRemovedEvent) => {
      delete this.fileMap[event.payload.fileName];
      if (this.autoCreateResult) {
        this.debouncedUpdateRoutesResult();
      }
    });
  }

  public findHonoRoutes() {
    if (!this.service) {
      throw new Error("Service not initialized");
    }

    return extractRouteTrees(this.service, this.ts, this.projectRoot);
  }

  public async teardown() {
    if (!this.isRunning) {
      return;
    }

    this.fileWatcher.teardown();
    this.fileWatcher.removeAllListeners();
    this._isRunning = false;
  }

  public get isRunning() {
    return this._isRunning;
  }

  public get lastSuccessfulResult() {
    return this._lastSuccessfulResult;
  }

  private getFileInfo(fileName: string) {
    return this.fileMap[fileName];
  }

  private getFileNames() {
    return Object.keys(this.fileMap);
  }
}

function debounce<T extends (...args: Array<unknown>) => void | Promise<void>>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

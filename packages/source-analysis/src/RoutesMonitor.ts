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
import { getParsedTsConfig, getTsLib, startServer } from "./service";
import type {
  Logger,
  TsISnapShot,
  TsLanguageService,
  TsProgram,
  TsType,
} from "./types";

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
  // Root directory of the project
  public readonly projectRoot: string;

  // Whether to automatically create the routes result
  public autoCreateResult = true;

  /**
   * Reference to the file watcher.
   *
   * Mostly an internal implementation detail but could be useful for debugging purposes
   */
  public readonly fileWatcher: FileWatcher;

  /**
   * Cache last known successful result
   */
  private _lastSuccessfulResult: RoutesResult | null = null;

  /**
   * Whether the monitor is running or not
   */
  private _isRunning = false;

  /**
   * Reference to the users' typescript instance
   */
  private _ts: TsType;

  /**
   * The language service used to analyze the routes
   */
  private _service: TsLanguageService | null = null;

  /**
   * The program used to analyze the routes
   *
   * This is cached to avoid re-analyzing the routes, however when there is a code change
   * it gets reset to null.
   */
  private _program: TsProgram | null = null;

  /**
   * Whether to turn up the aggressive caching or not
   * This is useful for debugging purposes
   */
  private _aggressiveCaching = true;

  /**
   * Map of files that have been added
   */
  private fileMap: Record<
    string,
    {
      version: number;
      content: string;
      snapshot: TsISnapShot;
    }
  > = {};

  /**
   * Debounced function to update the routes result. Used when
   * `autoCreateResult` is set to true
   */
  private debouncedUpdateRoutesResult: () => void;

  constructor(projectRoot: string, logger?: Logger) {
    super();
    this.projectRoot = projectRoot;
    this._ts = getTsLib(this.projectRoot);

    // Use the tsconfig include option to determine which files/locations to watch
    const options = getParsedTsConfig(this.projectRoot, this._ts);
    const include: Array<string> = Array.isArray(options.raw?.include)
      ? options.raw?.include
      : [];
    const configPath = options.configPath
      ? path.dirname(options.configPath)
      : projectRoot;
    const locations = include
      .filter((loc) => typeof loc === "string")
      .map((loc) => {
        return path.isAbsolute(loc)
          ? loc
          : path.resolve(path.join(configPath, loc));
      });

    logger?.log("BOOTS: locations pre-check", locations);

    if (locations.length === 0) {
      // Only watch the src directory (if it exists)
      const possibleLocation = path.resolve(path.join(projectRoot, "src"));
      const location = this.directoryExists(possibleLocation)
        ? possibleLocation
        : projectRoot;
      locations.push(path.join(location, "**", "*"));
    }

    logger?.log("BOOTS: Watching locations", locations);

    this.fileWatcher = new FileWatcher(locations);

    this.debouncedUpdateRoutesResult = debounce(() => {
      try {
        console.log("BOOTS: debouncedUpdateRoutesResult firing");
        this.updateRoutesResult();
      } catch (e) {
        console.error("Error while updating factory", e);
      }
    }, 50);
  }

  private fileExistsCache: Record<string, boolean> = {};
  public fileExists(fileName: string) {
    if (this._aggressiveCaching) {
      const cached = this.fileExistsCache[fileName];
      if (cached !== undefined) {
        return cached;
      }
    }

    const exists =
      this.getFileInfo(fileName) !== undefined ||
      this._ts.sys.fileExists(fileName);
    this.fileExistsCache[fileName] = exists;
    return exists;
  }

  private directoryExistsCache: Record<string, boolean> = {};
  public directoryExists(directory: string) {
    if (this._aggressiveCaching) {
      const cached = this.directoryExistsCache[directory];
      if (cached !== undefined) {
        return cached;
      }
    }

    const exists = this._ts.sys.directoryExists(directory);
    this.directoryExistsCache[directory] = exists;
    return exists;
  }

  public async start() {
    if (this.isRunning) {
      return;
    }

    this.addEventListenersToFileWatcher();
    await this.fileWatcher.start();

    this._service = startServer({
      directoryExists: this.directoryExists.bind(this),
      fileExists: this.fileExists.bind(this),
      getFileInfo: this.getFileInfo.bind(this),
      getScriptSnapshot: this.getScriptSnapshot.bind(this),
      getFileNames: () => this.getFileNames(),
      location: this.projectRoot,
      readFile: this.readFile.bind(this),
      ts: this._ts,
    });
    this._program = this._service.getProgram() ?? null;
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

  private readFile(fileName: string) {
    if (this._aggressiveCaching) {
      const info = this.getFileInfo(fileName);
      if (info) {
        return info.content;
      }
    }

    return this._ts.sys.readFile(fileName);
  }

  private getScriptSnapshot(fileName: string): TsISnapShot | undefined {
    if (this._aggressiveCaching) {
      const info = this.getFileInfo(fileName);
      if (info) {
        return info.snapshot;
      }
    }
    const sourceText = this._ts.sys.readFile(fileName);
    if (sourceText !== undefined) {
      return this._ts.ScriptSnapshot.fromString(sourceText);
    }
  }

  private addEventListenersToFileWatcher() {
    this.fileWatcher.on("fileAdded", (event) => {
      this.fileMap[event.payload.fileName] = {
        version: 0,
        content: event.payload.content,
        snapshot: this._ts.ScriptSnapshot.fromString(event.payload.content),
      };

      this._program = null;
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
      this._program = null;

      this.fileMap[event.payload.fileName] = {
        version: current.version + 1,
        content,
        snapshot: this._ts.ScriptSnapshot.fromString(content),
      };

      if (this.autoCreateResult) {
        this.debouncedUpdateRoutesResult();
      }
    });

    this.fileWatcher.on("fileRemoved", (event: FileRemovedEvent) => {
      this._program = null;
      delete this.fileMap[event.payload.fileName];
      if (this.autoCreateResult) {
        this.debouncedUpdateRoutesResult();
      }
    });
  }

  public findHonoRoutes() {
    this.fileExistsCache = {};

    if (!this._service) {
      throw new Error("Service not initialized");
    }

    // Only create the program if it hasn't been created yet
    // This is to avoid re-creating the program on every file change
    // and the getProgram call is slow.
    if (!this._program) {
      this._program = this._service.getProgram() ?? null;
    }

    if (!this._program) {
      throw new Error("Program not initialized");
    }

    return extractRouteTrees(
      this._service,
      this._program,
      this._ts,
      this.projectRoot,
    );
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

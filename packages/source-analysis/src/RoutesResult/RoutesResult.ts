import { Hono } from "hono";
import type { Next } from "hono/types";
import type { ResourceManager } from "../ResourceManager";
import type {
  LocalFileResource,
  LocalFileResourceId,
  MiddlewareEntryId,
  ModuleReferenceId,
  RouteEntryId,
  RouteTree,
  RouteTreeId,
  RouteTreeReferenceId,
  TreeResourceId,
} from "../types";

type HistoryId =
  | RouteEntryId
  | RouteTreeId
  | RouteTreeReferenceId
  | MiddlewareEntryId;

export class RoutesResult {
  /**
   * The resource manager used to keep track of resources
   */
  private _resourceManager: ResourceManager;

  /**
   * A map of all apps created
   */
  private _apps: Map<RouteTreeId, Hono> = new Map();

  /**
   * The history of visited resources. Can be reset using the `resetHistory` method
   *
   * The id's are the id's of the resources visited in the order they were visited
   */
  private _history: Array<HistoryId>;

  /**
   * The current app being built
   */
  private _currentApp: Hono | null = null;
  private _includeIds = false;
  private _rootId: RouteTreeId | null = null;

  constructor(resourceManager: ResourceManager, includeIds = false) {
    this._resourceManager = resourceManager;
    this._history = [];
    this._includeIds = includeIds;
  }

  /**
   * Resets the history of visited resources
   */
  public resetHistory() {
    this._history = [];
  }

  /**
   * Checks if a resource is in the history list
   */
  public hasVisited(id: HistoryId): boolean {
    return this._history.includes(id);
  }

  /**
   * Return the history array
   */
  public getHistory(): Array<TreeResourceId> {
    return [...this._history];
  }

  /**
   * Get the length of the history array
   */
  public getHistoryLength(): number {
    return this._history.length;
  }

  /**
   * Get the current app (throws an error if no app is set)
   */
  public get currentApp() {
    if (!this._currentApp) {
      throw new Error("No current app set");
    }

    return this._currentApp;
  }

  /**
   * Set the root tree id (mostly useful for testing)
   */
  public get rootId(): RouteTreeId | null {
    return this._rootId;
  }

  /**
   * Set the root tree id.
   *
   * (this updates the current app references)
   */
  public set rootId(rootId: RouteTreeId) {
    const tree = this._resourceManager.getResource(rootId);
    if (!tree) {
      throw new Error("Root tree not found");
    }

    this._currentApp = this.createApp(tree);
    this._rootId = rootId;
  }

  /**
   * Internal function used to create an app from a route tree
   */
  private createApp(tree: RouteTree) {
    // Create the app and add it to the apps map
    const app = new Hono();
    this._apps.set(tree.id, app);

    // Add middleware to add the RouteTreeId to the history
    app.use((_, next) => {
      this._history.push(tree.id);
      return next();
    });

    // Add all the entries of the current route tree
    for (const entryResourceId of tree.entries) {
      const resource = this._resourceManager.getResource(entryResourceId);

      if (!resource) {
        console.warn("Resource not found", entryResourceId);
        continue;
      }

      switch (resource.type) {
        case "ROUTE_ENTRY": {
          const method = resource.method ?? "all";

          app[method](resource.path, (c) => {
            this._history.push(resource.id);
            return c.text("Ok");
          });
          continue;
        }

        case "ROUTE_TREE_REFERENCE": {
          let targetApp = this._apps.get(resource.targetId);
          if (targetApp) {
            app.route(resource.path, targetApp);
          } else {
            const tree = this._resourceManager.getResource(resource.targetId);
            if (!tree) {
              console.warn("Referring resource not found", resource.targetId);
              continue;
            }

            targetApp = this.createApp(tree);
            if (targetApp) {
              app.route(resource.path, targetApp);
            }
          }
          continue;
        }

        case "MIDDLEWARE_ENTRY": {
          const middlewareFunc = async (_: unknown, next: Next) => {
            this._history.push(resource.id);
            await next();
          };
          if (resource.path) {
            app.use(resource.path, middlewareFunc);
          } else {
            app.use(middlewareFunc);
          }
          continue;
        }

        default: {
          // Typescript should never happen
          throw new Error(
            `Unsupported entry type: ${entryResourceId}` as never,
          );
        }
      }
    }

    return app;
  }

  public getFilesForHistory() {
    type FileInfo = {
      modules: Map<string, Array<string>>;
      sections: Map<number, string>;
    };

    const fileMap: Record<LocalFileResource["fileName"], FileInfo> = {};
    const visited = new Set<string>();
    const self = this;
    const includeIds = this._includeIds;

    function createFileInfo() {
      return {
        modules: new Map<string, Array<string>>(),
        sections: new Map<number, string>(),
      };
    }

    function addModules(file: FileInfo, moduleIds: Set<ModuleReferenceId>) {
      for (const moduleId of moduleIds) {
        const module = self._resourceManager.getResource(moduleId);
        if (!module) {
          console.warn("Module not found", moduleId, "module", module);
          continue;
        }

        if (!file.modules.has(module.importPath)) {
          file.modules.set(module.importPath, []);
        }

        const modules = file.modules.get(module.importPath);
        if (!modules) {
          // Given the logic above the modules should always be set
          throw new Error("The modules array is empty");
        }

        modules.push(module.import);
      }
    }

    function visit(
      id: LocalFileResourceId,
      appName: string,
    ): string | undefined {
      if (visited.has(id)) {
        return;
      }

      const resource = self._resourceManager.getResource(id);
      if (!resource) {
        console.warn("Resource not found", id);
        return;
      }

      visited.add(id);
      if (!fileMap[resource.fileName]) {
        fileMap[resource.fileName] = createFileInfo();
      }

      const currentFile = fileMap[resource.fileName];
      if (!currentFile) {
        throw new Error("Current file is not set");
      }
      const resourceType = resource.type;
      switch (resourceType) {
        case "ROUTE_TREE": {
          let content = `${
            includeIds
              ? `// id:${resource.id}
`
              : ""
          }const ${resource.name} = new Hono();`;
          if (resource.baseUrl) {
            content += `\n${resource.name}.baseUrl = "${resource.baseUrl}";`;
          }

          currentFile.sections.set(resource.position, content);

          return resource.name;
        }
        case "MIDDLEWARE_ENTRY": {
          if (!appName) {
            console.warn("Middleware entry outside of route tree");
            break;
          }

          let middleware = `${includeIds ? `// id:${resource.id}` : ""}\n`;
          if (resource.path) {
            middleware += `${appName}.use("${resource.path}", `;
          } else {
            middleware += `${appName}.use(`;
          }

          const middlewareFunctions = Array.from(resource.sources)
            .map((referenceId) => {
              const source = self._resourceManager.getResource(referenceId);
              if (!source) {
                console.warn("Source not found", referenceId);
                return;
              }

              // Inject modules
              addModules(currentFile, source.modules);

              for (const child of source.references) {
                visit(child, appName);
              }

              return source.content;
            })
            .filter(Boolean) as Array<string>;
          middleware += middlewareFunctions.join(", ");
          middleware += ");";

          currentFile.sections.set(resource.position, middleware);
          break;
        }
        case "ROUTE_ENTRY": {
          if (!appName) {
            console.warn("Route entry outside of route tree");
            break;
          }

          let entry = `${includeIds ? `// id:${resource.id}` : ""}
${appName}.${resource.method ?? "all"}("${resource.path}", `;

          for (const sourceId of resource.sources) {
            const source = self._resourceManager.getResource(sourceId);
            if (!source) {
              console.warn("Source not found", sourceId);
              continue;
            }

            addModules(currentFile, source.modules);

            for (const child of source.references) {
              visit(child, appName);
            }

            entry += source.content;
          }
          currentFile.sections.set(resource.position, entry);
          break;
        }
        case "ROUTE_TREE_REFERENCE": {
          const target = self._resourceManager.getResource(resource.targetId);
          if (!target) {
            console.warn("Target not found", resource.targetId);
            break;
          }

          currentFile.sections.set(
            resource.position,
            `${includeIds ? `// id:${resource.id}` : ""}
${appName}.route("${resource.path}", ${target.name});`,
          );

          // // Is this something that should be imported?
          // if (target.fileName !== resource.fileName) {
          //   const importPath = path.relative(
          //     resource.fileName,
          //     target.fileName,
          //   );
          //   addMos
          //   currentFile.modules.set(importPath,[target.name]);
          // }
          break;
        }
        case "SOURCE_REFERENCE": {
          currentFile.sections.set(
            resource.position,
            `${includeIds ? `// id:${resource.id}` : ""}
${resource.content}`,
          );
          addModules(currentFile, resource.modules);
          for (const child of resource.references) {
            visit(child, appName);
          }
          break;
        }
        default: {
          // If there's an error directly below:
          // the switch statement isn't covering all cases
          const exhaustiveCheck: never = resourceType;
          throw new Error(
            `Unsupported entry type: ${exhaustiveCheck}` as never,
          );
        }
      }
    }

    let name = "";
    for (const id of this._history) {
      const newName = visit(id, name);
      if (newName) {
        name = newName;
      }
    }

    const files: Record<string, string> = {};
    for (const [fileName, fileInfo] of Object.entries(fileMap)) {
      const imports = Array.from(
        fileInfo.modules.entries().map(([importPath, modules]) => {
          const asteriskModules = modules.filter((module) =>
            module.trim().startsWith("*"),
          );
          const nonAsteriskModules = modules.filter(
            (module) => !module.trim().startsWith("*"),
          );

          let returnValue = asteriskModules
            .map((module) => {
              return `import ${module} from "${importPath}";`;
            })
            .join("\n");

          if (nonAsteriskModules.length) {
            if (returnValue) {
              returnValue += "\n";
            }
            returnValue += `import { ${nonAsteriskModules.join(",")} } from "${importPath}";`;
          }

          return returnValue;
        }),
      ).join("\n");

      // Object.keys(fileInfo.sections);
      const keys = Array.from(fileInfo.sections.keys()).sort((a, b) => {
        if (a > b) {
          return 1;
        }

        if (a < b) {
          return -1;
        }

        return 0;
      });

      let sections = "";
      for (const key of keys) {
        if (sections.length > 0) {
          sections += "\n";
        }

        sections += fileInfo.sections.get(key) ?? "";
      }
      files[fileName] = imports ? `${imports}\n${sections}` : sections;
    }

    return Object.entries(files)
      .map(([fileName, content]) => {
        return `/* ${decodeURIComponent(fileName)} */
${content}
/* EOF: ${decodeURIComponent(fileName)} */`;
      })
      .join("\n");
  }
}

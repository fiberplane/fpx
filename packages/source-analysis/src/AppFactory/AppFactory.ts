import path from "node:path";
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

export class AppFactory {
  private resourceManager: ResourceManager;
  private apps: Map<RouteTreeId, Hono> = new Map();
  private history: Array<HistoryId>;
  private _currentApp: Hono | null = null;
  private includeIds = false;

  constructor(resourceManager: ResourceManager, includeIds = false) {
    this.resourceManager = resourceManager;
    this.history = [];
    this.includeIds = includeIds;
  }

  public resetHistory() {
    this.history = [];
  }

  public hasVisited(id: HistoryId): boolean {
    return this.history.includes(id);
  }

  public getHistory(): Array<TreeResourceId> {
    return this.history;
  }

  public getHistoryLength(): number {
    return this.history.length;
  }

  public setRootTree(entryId: RouteTreeId): Hono {
    const root = this.resourceManager.getResource(entryId);
    this.resetHistory();

    if (!root) {
      throw new Error("Could not find root tree");
    }

    this._currentApp = this.createApp(root);
    return this._currentApp;
  }

  public get currentApp() {
    if (!this._currentApp) {
      throw new Error("No current app set");
    }

    return this._currentApp;
  }

  private createApp(tree: RouteTree) {
    const app = new Hono();

    this.apps.set(tree.id, app);

    app.use((c, next) => {
      this.history.push(tree.id);
      return next();
    });

    for (const entry of tree.entries) {
      const resource = this.resourceManager.getResource(entry);
      if (!resource) {
        console.warn("Resource not found", entry);
        continue;
      }

      switch (resource.type) {
        case "ROUTE_ENTRY": {
          app.get(resource.path, (c) => {
            this.history.push(resource.id);
            return c.text("Ok");
          });
          continue;
        }

        case "ROUTE_TREE_REFERENCE": {
          let targetApp = this.apps.get(resource.targetId);
          if (targetApp) {
            app.route(resource.path, targetApp);
          } else {
            const tree = this.resourceManager.getResource(resource.targetId);
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
            this.history.push(resource.id);
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
          throw new Error(`Unsupported entry type: ${entry}` as never);
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
    const includeIds = this.includeIds;

    function createFileInfo() {
      return {
        modules: new Map<string, Array<string>>(),
        sections: new Map<number, string>(),
      };
    }

    function addModules(file: FileInfo, moduleIds: Set<ModuleReferenceId>) {
      for (const moduleId of moduleIds) {
        const module = self.resourceManager.getResource(moduleId);
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

      const resource = self.resourceManager.getResource(id);
      if (!resource) {
        console.warn("Resource not found", id);
        return;
      }

      visited.add(id);
      if (!fileMap[resource.fileName]) {
        fileMap[resource.fileName] = createFileInfo();
      }

      const currentFile = fileMap[resource.fileName];
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
              const source = self.resourceManager.getResource(referenceId);
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
            const source = self.resourceManager.getResource(sourceId);
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
          const target = self.resourceManager.getResource(resource.targetId);
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
          const _exhaustiveCheck: never = resourceType;
          throw new Error(`Unsupported entry type: ${resourceType}` as never);
        }
      }
    }

    let name = "";
    for (const id of this.history) {
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

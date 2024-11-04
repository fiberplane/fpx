// import { ModuleReference } from "typescript";
import path from "node:path";
import { Hono } from "hono";
import type { Next } from "hono/types";
import type { ResourceManager } from "./ResourceManager";
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
} from "./types";

type HistoryId =
  | RouteEntryId
  | RouteTreeId
  | RouteTreeReferenceId
  | MiddlewareEntryId;

export class AppFactory {
  private resourceManager: ResourceManager;
  private apps: Map<RouteTreeId, Hono> = new Map();
  private history: Array<HistoryId>;

  constructor(resourceManager: ResourceManager) {
    this.resourceManager = resourceManager;
    this.history = [];
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

  // public getVisitedNode(id: string) {
  // return this.trees.find((tree) => tree.id === id);
  // }

  public getApp(entryId: RouteTreeId): Hono {
    // const root = this.trees.find((tree) => tree.id === entryId);
    const root = this.resourceManager.getResource(entryId);
    this.resetHistory();

    if (!root) {
      throw new Error("Could not find root tree");
    }

    return this.createApp(root);
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
      // this.resources[entry] as RouteTreeEntry | undefined;
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
      modules: Record<string, Array<string>>;
      sections: Record<number, string>;
    };

    const fileMap: Record<LocalFileResource["fileName"], FileInfo> = {};
    const visited = new Set<string>();
    const self = this;

    function createFileInfo() {
      return {
        modules: {},
        sections: {},
      };
    }

    function addModules(file: FileInfo, moduleIds: Array<ModuleReferenceId>) {
      for (const moduleId of moduleIds) {
        const module = self.resourceManager.getResource(moduleId);
        if (!module) {
          console.warn("Module not found", moduleId, "module", module);
          continue;
        }

        if (!file.modules[module.importPath]) {
          file.modules[module.importPath] = [];
        }
        console.log("module", module);
        file.modules[module.importPath].push(module.import);
      }
    }

    function visit(id: LocalFileResourceId, appName: string) {
      if (visited.has(id)) {
        return;
      }

      const resource = self.resourceManager.getResource(id);
      if (!resource) {
        console.warn("Resource not found", id);
        return;
      }

      if (
        resource.type !== "ROUTE_TREE" &&
        resource.type !== "ROUTE_TREE_REFERENCE"
      ) {
        console.log("resource", resource.modules);
      }
      visited.add(id);
      if (!fileMap[resource.fileName]) {
        fileMap[resource.fileName] = createFileInfo();
      }
      const currentFile = fileMap[resource.fileName];
      switch (resource.type) {
        case "ROUTE_TREE": {
          currentFile.sections[resource.position] = `const ${resource.name} = new Hono();
${resource.name}.baseUrl = "${resource.baseUrl}";
          `;
          for (const entry of resource.entries) {
            visit(entry, resource.name);
          }
          break;
        }
        case "MIDDLEWARE_ENTRY": {
          if (!appName) {
            console.warn("Middleware entry outside of route tree");
            break;
          }

          let middleware = `// Middleware entry:${resource.id}\n`;
          if (resource.path) {
            middleware += `${appName}.use("${resource.path}", `;
          } else {
            middleware += `${appName}.use(`;
          }

          const middlewareFunctions = resource.sources
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

          // middleware += `/* Source reference ${source.id} */ ${source.content}`;
          // if (!currentFile.modules[source.fileName]) {
          //   currentFile.modules[source.fileName] = [];
          // }
          // currentFile.modules[source.fileName].push(source.position.toString());
          currentFile.sections[resource.position] = middleware;
          break;
        }
        // currentFile.sections[resource.position.toString()] = "// Middleware entry";
        //           currentFile.sections[resource.position.toString()] = `// Middleware entry
        // ${appName}.use(${resource.path ? `"${resource.path}" ,`:""}`;
        // }
        case "ROUTE_ENTRY": {
          if (!appName) {
            console.warn("Route entry outside of route tree");
            break;
          }

          let entry = `// Route entry:${resource.id}
${appName}.${resource.method}("${resource.path}", `;

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
          currentFile.sections[resource.position] = entry;
          break;
        }
        case "ROUTE_TREE_REFERENCE": {
          const target = self.resourceManager.getResource(resource.targetId);
          if (!target) {
            console.warn("Target not found", resource.targetId);
            break;
          }

          currentFile.sections[resource.position] =
            `// Route tree reference:${resource.id}
${appName}.route("${resource.path}", ${target.name});`;

          // Is this something that should be imported?
          if (target.fileName !== resource.fileName) {
            const importPath = path.relative(
              resource.fileName,
              target.fileName,
            );
            currentFile.modules[importPath] = [target.name];
          }

          visit(resource.targetId, appName);
          break;
          // if (!fileMap[target.fileName]) {
          //   fileMap[target.fileName] = createFileInfo();
          // }
          // for (const entry of target.entries) {
          //   visit(entry, appName);
          // }
        }
        default: {
          console.warn("Unsupported resource type", resource.type);
        }
      }
    }

    for (const id of this.history) {
      visit(id, "");
    }

    const files: Record<string, string> = {};
    for (const [fileName, fileInfo] of Object.entries(fileMap)) {
      const imports = Object.entries(fileInfo.modules)
        .map(([importPath, modules]) => {
          return `import { ${modules.join(", ")} } from "${importPath}";`;
        })
        .join("\n");

      console.log("imports", fileInfo.modules);
      const sections = Object.entries(fileInfo.sections)
        .sort(([a], [b]) => {
          if (a > b) {
            return 1;
          }

          if (a < b) {
            return -1;
          }
          return 0;
        })
        .map(([_, content]) => {
          return content;
        })
        .join("\n");

      files[fileName] = `${imports}\n\n${sections}`;
    }

    return Object.entries(files)
      .map(([fileName, content]) => {
        return `//@ Start file: ${fileName}
${content}
//@ EOF file: ${fileName}
`;
      })
      .join("\n\n");
    // Object.entries(fileMap)

    // .forEach(([fileName, fileInfo]) => {
    // .map(([_, content]) => {
    //       return content;
    //     }).join("\n");

    //     return `${imports}\n\n${sections}`;
    //   })
    // );
    // if (resource.type === "ROUTE_TREE") {
    //   for (const entry of resource.entries) {
    //     if (entry.type === "ROUTE_TREE_REFERENCE") {
    //       visit(entry.targetId);
    //     }
    //   }
    // }
    // }
    //   for(const id of this.history) {
    //     const resource = this.resourceManager.getResource(id);
    //     if (!resource) {
    //       console.warn("Resource not found", id);
    //       continue;
    //     }

    //     if (resource.type === "ROUTE_TREE")
    //       // const data = this.resourceManager.decodeId(id);
    //       // if
    //       // if (data.type === "MODULE_REFERENCE") {

    //       // fileMap[resource.fileName] = true;
    //     }
    //   // return this.history.map((id) => {
    //   //   const resource = this.resources[id];
    //   //   if (!resource) {
    //   //     console.warn("Resource not found", id);
    //   //     return "";
    //   //   }

    //   //   return resource.fileName;
    //   // });
  }
}

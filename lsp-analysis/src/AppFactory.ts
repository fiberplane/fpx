import { Hono } from "hono";
import type { Next } from "hono/types";
import type {
  RouteEntryId,
  RouteTree,
  RouteTreeEntry,
  RouteTreeId,
  TreeResource,
} from "./types";

export class AppFactory {
  private resources: Record<string, TreeResource>;
  private apps: Map<RouteTreeId, Hono> = new Map();
  private history: Array<TreeResource["id"]>;

  constructor(resources: Record<string, TreeResource>) {
    this.resources = resources;
    this.history = [];
  }

  public resetHistory() {
    this.history = [];
  }

  public hasVisited(id: TreeResource["id"]): boolean {
    return this.history.includes(id);
  }

  public getHistoryLength(): number {
    return this.history.length;
  }

  // public getVisitedNode(id: string) {
  // return this.trees.find((tree) => tree.id === id);
  // }

  public getApp(entryId: RouteEntryId): Hono {
    // const root = this.trees.find((tree) => tree.id === entryId);
    const root = this.resources[entryId] as RouteTree;
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
      const resource = this.resources[entry] as RouteTreeEntry | undefined;
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
            const tree = this.resources[resource.targetId] as
              | RouteTree
              | undefined;
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
}

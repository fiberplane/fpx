import { Hono } from "hono";
import type { RouteElement, RouteTree } from "./types";

export class AppFactory {
  private trees: Array<RouteTree>;
  private apps: Map<string, Hono> = new Map();
  private history: Map<string, RouteElement>;

  constructor(trees: Array<RouteTree>) {
    this.trees = trees;
  }

  public resetHistory() {
    this.history = new Map();
  }

  public hasVisited(id: string): boolean {
    return this.history.has(id);
  }

  public getHistoryLength(): number {
    return this.history.size;
  }

  public getVisitedNode(id: string) {
    return this.trees.find((tree) => tree.id === id);
  }

  public getApp(entryId: string): Hono {
    const root = this.trees.find((tree) => tree.id === entryId);
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
      this.history.set(tree.id, tree);
      return next();
    });

    // for (const entry of tree.entries) {
    //   switch (entry.type) {
    //     case "ROUTE_ENTRY": {
    //       app.get(entry.path, (c) => {
    //         this.history.set(entry.id, entry);
    //         return c.text("Ok");
    //       });
    //       continue;
    //     }

    //     case "ROUTE_TREE_REFERENCE": {
    //       if (this.apps.has(entry.targetId)) {
    //         const targetApp = this.apps.get(entry.targetId);
    //         app.route(entry.path, targetApp);
    //       } else {
    //         const tree = this.trees.find((tree) => tree.id === entry.targetId);
    //         if (tree) {
    //           const targetApp = this.createApp(tree);
    //           app.route(entry.path, targetApp);
    //         }
    //       }
    //       continue;
    //     }

    //     case "MIDDLEWARE_ENTRY": {
    //       const middlewareFunc = async (c, next) => {
    //         this.history.set(entry.id, entry);
    //         await next();
    //       };
    //       if (entry.path) {
    //         app.use(entry.path, middlewareFunc);
    //       } else {
    //         app.use(middlewareFunc);
    //       }
    //       continue;
    //     }

    //     default: {
    //       const exhaustiveCheck: never = entry;
    //       // Typescript should never happen
    //       throw new Error(`Unsupported entry type: ${exhaustiveCheck}`);
    //     }
    //   }
    // }

    return app;
  }
}

import { Hono } from "hono";
import type { Next } from "hono/types";
import type { ResourceManager } from "../ResourceManager";
import { logger } from "../logger";
import type {
  MiddlewareEntryId,
  RouteEntryId,
  RouteTree,
  RouteTreeId,
  RouteTreeReferenceId,
  TreeResourceId,
} from "../types";
import { generate } from "./generate";

export type HistoryId =
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
   * Get the root tree id (mostly useful for testing)
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
        logger.warn("Resource not found", entryResourceId);
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
              logger.warn("Referring resource not found", resource.targetId);
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
    return generate(this._resourceManager, this._history, this._includeIds);
  }

  public getRouteEntries() {
    const resources = Object.values(this._resourceManager.getResources());
    return resources.filter((resource) => resource.type === "ROUTE_ENTRY");
  }
}

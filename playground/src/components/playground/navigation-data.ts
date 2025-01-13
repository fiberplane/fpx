export type OpenAPIPath = {
  path: string;
  method: "get" | "post" | "put" | "delete" | "patch";
  operationId: string;
  summary?: string;
  tags: string[];
};

export type NavigationItem = {
  title: string; // This represents the tag
  routes?: {
    name: string;
    path: string;
    method: string;
    summary?: string;
  }[];
};

export function getNavigationData(): NavigationItem[] {
  // This simulates parsing an OpenAPI spec where paths are grouped by tags
  const mockOpenAPISpec = {
    paths: {
      "/geese": {
        get: {
          operationId: "ListGeese",
          summary: "List all geese",
          tags: ["GEESE"],
        },
        post: {
          operationId: "CreateGoose",
          summary: "Create a new goose",
          tags: ["GEESE"],
        },
      },
      "/geese/{id}": {
        delete: {
          operationId: "DeleteGoose",
          summary: "Delete a goose",
          tags: ["GEESE"],
        },
        put: {
          operationId: "EditGoose",
          summary: "Update a goose",
          tags: ["GEESE"],
        },
      },
      "/geese/quotes": {
        get: {
          operationId: "ListQuotes",
          summary: "List all quotes",
          tags: ["GEESE"],
        },
        post: {
          operationId: "CreateQuote",
          summary: "Create a new quote",
          tags: ["GEESE"],
        },
      },
      "/geese/quotes/{id}": {
        delete: {
          operationId: "DeleteQuote",
          summary: "Delete a quote",
          tags: ["GEESE"],
        },
        put: {
          operationId: "Editquote",
          summary: "Update a quote",
          tags: ["GEESE"],
        },
      },
      "/geese/leader": {
        get: {
          operationId: "FlockLeader",
          summary: "Get the flock leader",
          tags: ["GEESE"],
        },
      },
      "/geese/honc": {
        post: {
          operationId: "Honc",
          summary: "Make a goose honc",
          tags: ["GEESE"],
        },
      },
      "/animals": {
        get: {
          operationId: "ListAnimals",
          summary: "List all animals",
          tags: ["ANIMALS"],
        },
      },
      "/dogs": {
        get: {
          operationId: "ListDogs",
          summary: "List all dogs",
          tags: ["DOGGOS"],
        },
      },
      "/cats": {
        get: {
          operationId: "ListCats",
          summary: "List all cats",
          tags: ["CATS"],
        },
      },
      "/reptiles": {
        get: {
          operationId: "ListReptiles",
          summary: "List all reptiles",
          tags: ["REPTILES"],
        },
      },
      "/fish": {
        get: {
          operationId: "ListFish",
          summary: "List all fish",
          tags: ["FISH"],
        },
      },
      "/deer": {
        get: {
          operationId: "ListDeer",
          summary: "List all deer",
          tags: ["DEER"],
        },
      },
    },
  };

  // Transform OpenAPI spec into navigation items
  const routesByTag = new Map<string, Array<{ name: string; path: string; method: string; summary?: string }>>();

  // Process each path and its operations
  for (const [path, operations] of Object.entries(mockOpenAPISpec.paths)) {
    for (const [method, operation] of Object.entries(operations)) {
      for (const tag of operation.tags) {
        if (!routesByTag.has(tag)) {
          routesByTag.set(tag, []);
        }
        routesByTag.get(tag)?.push({
          name: operation.operationId,
          path,
          method: method.toUpperCase(),
          summary: operation.summary,
        });
      }
    }
  }

  // Convert to NavigationItem array
  return Array.from(routesByTag.entries()).map(([tag, routes]) => ({
    title: tag,
    routes: routes.sort((a, b) => a.name.localeCompare(b.name)),
  }));
} 
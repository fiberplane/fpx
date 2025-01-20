import { Link, useMatchRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "@/components/mode-toggle";
import { PlusIcon } from "@radix-ui/react-icons";
import type { Workflow, OAISchema } from "@/types";
import { useSchemas } from "@/lib/hooks/useSchemas";
import { validate } from "@scalar/openapi-parser";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface WorkflowSidebarProps {
  workflows: Workflow[];
}

interface RouteInfo {
  method: string;
  path: string;
}

interface GroupedRoutes {
  [tag: string]: RouteInfo[];
}

interface OpenAPIOperation {
  tags?: string[];
}

interface OpenAPIPathItem {
  get?: OpenAPIOperation;
  post?: OpenAPIOperation;
  put?: OpenAPIOperation;
  delete?: OpenAPIOperation;
  options?: OpenAPIOperation;
  patch?: OpenAPIOperation;
  head?: OpenAPIOperation;
  parameters?: unknown;
}

const methodColors: Record<string, string> = {
  GET: "text-green-500",
  POST: "text-blue-500",
  PUT: "text-yellow-500",
  DELETE: "text-red-500",
  PATCH: "text-purple-500",
  HEAD: "text-gray-500",
  OPTIONS: "text-gray-400",
};

const GENERAL_TAG = "General";

async function parseOpenAPISchema(schema: OAISchema) {
  const { valid, schema: parsedSchema } = await validate(schema.content);
  if (!valid || !parsedSchema?.paths) {
    throw new Error("Invalid OpenAPI schema");
  }

  const grouped: GroupedRoutes = {};
  const generalRoutes: RouteInfo[] = [];

  for (const [path, pathObj] of Object.entries(parsedSchema.paths)) {
    const pathItem = pathObj as OpenAPIPathItem;
    for (const [method, operation] of Object.entries(pathItem)) {
      if (method === "parameters" || !operation) {
        continue;
      }

      const tags = operation.tags || [];
      const routeInfo: RouteInfo = {
        method: method.toUpperCase(),
        path,
      };

      if (tags.length === 0) {
        generalRoutes.push(routeInfo);
      } else {
        for (const tag of tags) {
          if (!grouped[tag]) {
            grouped[tag] = [];
          }
          grouped[tag].push(routeInfo);
        }
      }
    }
  }

  // Add general routes at the end if there are any
  if (generalRoutes.length > 0) {
    grouped[GENERAL_TAG] = generalRoutes;
  }

  return grouped;
}

export function WorkflowSidebar({ workflows }: WorkflowSidebarProps) {
  const { data: schemas } = useSchemas();
  const firstSchema = schemas?.[0];

  const matchRoute = useMatchRoute();
  const hideRoutes = matchRoute({ to: "/workflow" });

  const { data: groupedRoutes } = useQuery<GroupedRoutes>({
    queryKey: ["routes", firstSchema?.id],
    queryFn: async () => {
      if (!firstSchema) {
        return {};
      }
      return parseOpenAPISchema(firstSchema);
    },
    enabled: !!firstSchema,
    initialData: {},
  });

  return (
    <div className="min-h-full overflow-auto border-r">
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 font-mono text-xs font-semibold rounded bg-primary text-primary-foreground">
              fpx
            </div>
            <span className="font-semibold text-foreground">Workflows</span>
          </div>
          <ModeToggle />
        </div>

        <div className="relative mb-6 grid grid-cols-[1fr_auto] gap-2">
          <Input
            type="search"
            placeholder="Search"
            className="w-full pr-12 bg-white"
          />
          <Link to="/workflow/new">
            <Button variant="default" size="icon" disabled={!firstSchema}>
              <PlusIcon className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-4">
          <div>
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
              Workflows
            </h2>
            <div className="grid gap-2">
              {workflows?.slice(0, 5).map((workflow) => (
                <Link
                  key={workflow.workflowId}
                  to="/workflow/$workflowId"
                  params={{ workflowId: workflow.workflowId }}
                  className="flex items-start justify-between p-2 text-sm rounded cursor-pointer hover:bg-muted"
                >
                  <div className="grid gap-1">
                    <div className="font-medium truncate">
                      {workflow.summary}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {workflow.steps.length} steps
                    </div>
                  </div>
                </Link>
              ))}
              {workflows.length > 5 && (
                <Link
                  to="/workflow"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  View all workflows ({workflows.length})
                </Link>
              )}
            </div>
          </div>

          {!hideRoutes && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
                Routes
              </h2>
              <div className="grid gap-2">
                {Object.entries(groupedRoutes || {}).map(([tag, routes]) => (
                  <div key={tag} className="mb-4">
                    <h3 className="mb-2 text-xs font-medium text-muted-foreground">
                      {tag}
                    </h3>
                    <div className="grid gap-1">
                      {routes.map((route, index) => (
                        <div
                          key={`${route.method}-${route.path}-${index}`}
                          className="flex items-center gap-2 p-2 text-xs rounded hover:bg-muted"
                        >
                          <span
                            className={cn(
                              "font-mono font-medium w-14",
                              methodColors[route.method] || "text-gray-500",
                            )}
                          >
                            {route.method}
                          </span>
                          <span className="font-mono truncate text-muted-foreground">
                            {route.path}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

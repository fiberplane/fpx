import { WorkflowCommand } from "@/components/WorkflowCommand";
import type { QueryClient } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import React from "react";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  openapi:
    | {
        url?: string;
        content?: string;
      }
    | undefined;
}>()({
  component: RootComponent,
  beforeLoad: async ({ context }) => {
    if (context.openapi?.url) {
      const content = await fetch(context.openapi.url).then((res) =>
        res.text(),
      );
      if (context.openapi) {
        context.openapi.content = content;
      }
    }
  },
});

function RootComponent() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex-1">
        <WorkflowCommand />
        <Outlet />
      </div>
      {/*  Commented out because they're annoying but leaving them here in case you need them */}
      {/* <TanStackRouterDevtools position="bottom-right" /> */}
      {/* <ReactQueryDevtools /> */}
    </div>
  );
}

// NOTE - Only exported to avoid typescript errors during compilation when this is commented out
export const TanStackRouterDevtools =
  process.env.NODE_ENV === "production"
    ? () => null // Render nothing in production
    : React.lazy(() =>
        // Lazy load in development
        import("@tanstack/router-devtools").then((res) => ({
          default: res.TanStackRouterDevtools,
          // For Embedded Mode
          // default: res.TanStackRouterDevtoolsPanel
        })),
      );

// NOTE - Only exported to avoid typescript errors during compilation when this is commented out
export const ReactQueryDevtools =
  process.env.NODE_ENV === "production"
    ? () => null // Render nothing in production
    : React.lazy(() =>
        // Lazy load in development
        import("@tanstack/react-query-devtools").then((res) => ({
          default: res.ReactQueryDevtools,
        })),
      );

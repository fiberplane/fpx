import { WorkflowCommand } from "@/components/WorkflowCommand";
import { Icon } from "@iconify/react/dist/iconify.js";
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
  // NOTE - I am getting the feeling this executes many many times
  loader: async ({ context }) => {
    if (context.openapi?.url) {
      const content = await fetch(context.openapi.url).then((res) =>
        res.text(),
      );
      if (context.openapi) {
        context.openapi.content = content;
      }
    }
  },
  // gcTime: 10 * 60 * 1000,
  // preloadStaleTime: 10 * 60 * 1000,
  staleTime: 10 * 60 * 1000,
  // : 5 * 1000,

  onError: (error) => {
    console.error("Error loading openapi spec", error);
  },
  errorComponent: (props) => {
    // console.log('props', props)
    return <ErrorBoundary {...props} />;
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

function ErrorBoundary(props: { error: unknown }) {
  const { error } = props;
  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="flex flex-col gap-2 w-[500px] max-w-screen">
          <div className="grid grid-cols-[auto_1fr] gap-2 items-center">
            <Icon
              icon="lucide:alert-triangle"
              width={48}
              height={48}
              className="text-danger"
            />
            <p className="text-lg">
              An error occurred while fetching the OpenAPI spec.
            </p>
          </div>
          {error instanceof Error && (
            <>
              <div className="w-full text-sm">Details:</div>
              <code className="text-sm font-mono bg-muted p-2 rounded-lg">
                <pre className="overflow-auto">{error.message}</pre>
              </code>
            </>
          )}
        </div>
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

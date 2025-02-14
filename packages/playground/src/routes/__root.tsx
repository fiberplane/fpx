import { ErrorScreen } from "@/components/ErrorScreen";
import { WorkflowCommand } from "@/components/WorkflowCommand";
import { isFetchOpenApiSpecError } from "@/lib/api";
import { openApiSpecQueryOptions } from "@/lib/hooks/useOpenApiSpec";
import { Icon } from "@iconify/react";
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
  loader: async ({ context }) => {
    if (!context.openapi?.url && !context.openapi?.content) {
      return { context };
    }

    const queryOptions = openApiSpecQueryOptions(context.openapi);
    const content = await context.queryClient.ensureQueryData(queryOptions);

    return {
      context: {
        ...context,
        openapi: {
          ...context.openapi,
          content,
        },
      },
    };
  },
  staleTime: 10 * 60 * 1000,

  onError: (error) => {
    console.error("Error loading openapi spec", error);
  },
  errorComponent: ({ error, info }) => {
    if (isFetchOpenApiSpecError(error)) {
      return (
        <ErrorScreen
          error={error}
          title="Error fetching OpenAPI spec"
          message={
            error.message ??
            "Something went wrong while loading the OpenAPI spec."
          }
        />
      );
    }
    return (
      <ErrorBoundary
        error={error}
        info={info ? info : { componentStack: "" }}
      />
    );
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

function ErrorBoundary({
  error,
  info,
}: { error: Error; info: { componentStack: string } }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col items-center justify-center h-screen gap-2">
        <Icon
          icon="lucide:alert-triangle"
          width={48}
          height={48}
          className="text-danger"
        />
        <p className="text-lg">
          {error.message}
          {process.env.NODE_ENV !== "production" ? info?.componentStack : null}
        </p>
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

import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ThemeProvider } from "@/components/theme-provider";
import { WorkflowSidebar } from "@/components/WorkflowSidebar";
import { workflowsQueryOptions } from "@/lib/hooks/useWorkflows";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useIsLgScreen } from "@/hooks";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Layout } from "@/Layout";
import type { OpenAPISpec } from "@/types";

export const Route = createFileRoute("/workflow")({
  component: WorkflowLayout,
  loader: async ({ context: { queryClient } }) => {
    const workflowsResponse = await queryClient.ensureQueryData(
      workflowsQueryOptions(),
    );
    const openApiSpec = getOpenApiSpec();
    return {
      workflows: workflowsResponse.data,
      openApiSpec,
    };
  },
});

function getMainSectionWidth() {
  return window.innerWidth - 85;
}

function WorkflowLayout() {
  const { workflows } = Route.useLoaderData();
  const [sidePanel, setSidePanel] = useState<"open" | "closed">("open");
  const isLgScreen = useIsLgScreen();
  const width = getMainSectionWidth();

  // Panel constraints for responsive layout
  const minSize = (320 / width) * 100;
  // const maxSize = Math.min(50, (500 / width) * 100);

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Layout>
        <div className={cn("h-[calc(100vh-40px)]", "grid", "gap-2", "p-2")}>
          <ResizablePanelGroup direction="horizontal" className="w-full">
            {isLgScreen && sidePanel === "open" && (
              <>
                <ResizablePanel
                  id="sidebar"
                  order={0}
                  minSize={minSize}
                  // maxSize={maxSize}
                  defaultSize={(320 / width) * 100}
                >
                  <div
                    className={cn(
                      "px-4 overflow-hidden border rounded-md",
                      "h-full",
                      "flex",
                      "flex-col",
                      "pt-4",
                    )}
                  >
                    <WorkflowSidebar workflows={workflows} />
                  </div>
                </ResizablePanel>
                <ResizableHandle
                  hitAreaMargins={{ coarse: 20, fine: 10 }}
                  className="w-0 mr-2"
                />
              </>
            )}
            <ResizablePanel id="main" order={1}>
              <div className="flex flex-col h-full min-h-0">
                <Outlet />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </Layout>
    </ThemeProvider>
  );
}

export type ResolvedSpecResult =
  | {
      type: "success";
      spec: OpenAPISpec;
    }
  | {
      type: "error";
      error: string;
      source: string;
      retryable: boolean;
      attemptedUrl?: string;
    }
  | {
      type: "empty";
    };

function getOpenApiSpec(): ResolvedSpecResult {
  // Try to get the spec from the DOM
  const specElement = document.getElementById("fp-api-spec");
  const errorElement = document.getElementById("fp-api-spec-error");

  // If we have an error element, parse it to get error details
  if (errorElement?.textContent) {
    try {
      const errorResult = JSON.parse(
        errorElement.textContent,
      ) as ResolvedSpecResult;
      if (errorResult.type === "error") {
        return errorResult;
      }
    } catch {
      // If we can't parse the error, fall through to try the spec
    }
  }

  // If we have a spec element, try to parse it
  if (specElement?.textContent) {
    try {
      const spec = JSON.parse(specElement.textContent) as OpenAPISpec;
      return { type: "success", spec };
    } catch (error) {
      return {
        type: "error",
        error: "Failed to parse API spec from DOM",
        source: "dom",
        retryable: false,
      };
    }
  }

  // If we have neither element, return empty
  return { type: "empty" };
}

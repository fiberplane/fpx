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

export const Route = createFileRoute("/workflow")({
  component: WorkflowLayout,
  loader: async ({ context: { queryClient } }) => {
    const response = await queryClient.ensureQueryData(workflowsQueryOptions());
    return { workflows: response.data };
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

import { Layout } from "@/Layout";
import { WorkflowSidebar } from "@/components/WorkflowSidebar";
import { CommandBar } from "@/components/playground/CommandBar/CommandBar";
import { ThemeProvider } from "@/components/theme-provider";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useIsLgScreen } from "@/hooks";
import { workflowsQueryOptions } from "@/lib/hooks/useWorkflows";
import { cn } from "@/lib/utils";
import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
// TODO: change this once we have a better type

export const Route = createFileRoute("/workflows")({
  component: WorkflowLayout,
  loader: async ({ context: { queryClient } }) => {
    const workflowsResponse = await queryClient.ensureQueryData(
      workflowsQueryOptions(),
    );
    return {
      workflows: workflowsResponse.data,
    };
  },
});

function getMainSectionWidth() {
  return window.innerWidth - 85;
}

function WorkflowLayout() {
  const [sidePanel] = useState<"open" | "closed">("open");
  const isLgScreen = useIsLgScreen();
  const width = getMainSectionWidth();
  const [commandBarOpen, setCommandBarOpen] = useState(false);

  useHotkeys("meta+k", () => {
    setCommandBarOpen(true);
  });
  // Panel constraints for responsive layout
  const minSize = (320 / width) * 100;
  // const maxSize = Math.min(50, (500 / width) * 100);

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Layout>
        <div className={cn("h-[calc(100vh-70px)]", "grid", "gap-2", "p-2")}>
          <CommandBar open={commandBarOpen} setOpen={setCommandBarOpen} />
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
                    <WorkflowSidebar />
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

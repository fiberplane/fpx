import { Layout } from "@/Layout";
import { ThemeProvider } from "@/components/theme-provider";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { NavigationPanel } from "@/garbage/RequestorPage/NavigationPanel";
import { NavigationFrame } from "@/garbage/RequestorPage/NavigationPanel";
import { useIsLgScreen } from "@/hooks";
import { cn } from "@/lib/utils";
import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/traces")({
  component: TracesLayout,
});

function getMainSectionWidth() {
  return window.innerWidth - 85;
}

function TracesLayout() {
  const [sidePanel] = useState<"open" | "closed">("open");
  const isLgScreen = useIsLgScreen();
  const width = getMainSectionWidth();

  // Panel constraints for responsive layout
  const minSize = (320 / width) * 100;

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Layout>
        <div className={cn("h-[calc(100vh-70px)]", "grid", "gap-2", "p-2")}>
          <ResizablePanelGroup direction="horizontal" className="w-full">
            {isLgScreen && sidePanel === "open" && (
              <>
                <ResizablePanel
                  id="sidebar"
                  order={0}
                  minSize={minSize}
                  defaultSize={(320 / width) * 100}
                >
                  <NavigationFrame>
                    <NavigationPanel />
                  </NavigationFrame>
                </ResizablePanel>
                <ResizableHandle
                  hitAreaMargins={{ coarse: 20, fine: 10 }}
                  className="w-0 mr-2"
                />
              </>
            )}
            <ResizablePanel id="main" order={1}>
              <div className="grid grid-cols-1 h-full min-h-0 overflow-hidden overflow-y-auto relative">
                <Outlet />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </Layout>
    </ThemeProvider>
  );
}

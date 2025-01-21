import "./styles.css";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  usePanelConstraints,
} from "@/components/ui/resizable";
import { useIsLgScreen } from "@/hooks";
import { cn } from "@/lib/utils";
import { NavigationFrame, NavigationPanel } from "./NavigationPanel";
import { RequestorPageContent } from "./RequestorPageContent";
// import { SettingsPage } from "./Settings/SettingsPage";
import { useRoutes } from "./routes";
import { useStudioStore } from "./store";

/**
 * Estimate the size of the main section based on the window width
 */
function getMainSectionWidth() {
  return window.innerWidth - 85;
}

export const RequestorPage = () => {
  // NOTE - This sets the `routes` and `serviceBaseUrl` in the reducer
  const { isLoading: _isLoading, isError: _isError } = useRoutes();

  const { sidePanel, settingsOpen } = useStudioStore(
    "sidePanel",
    "settingsOpen",
  );

  const width = getMainSectionWidth();
  const isLgScreen = useIsLgScreen();

  const { minSize, maxSize } = usePanelConstraints({
    groupId: "main-layout",
    initialGroupSize: width,
    minPixelSize: 320,
    minimalGroupSize: 944,
  });

  // if (settingsOpen) {
  //   return <SettingsPage />;
  // }

  return (
    <div
      className={cn("h-[calc(100vh-40px)]", "flex", "flex-col", "gap-2", "p-2")}
    >
      <ResizablePanelGroup
        direction="horizontal"
        id="main-layout"
        className="w-full"
      >
        {isLgScreen && sidePanel === "open" && (
          <>
            <ResizablePanel
              id="routes"
              order={0}
              minSize={minSize}
              maxSize={maxSize}
              defaultSize={(320 / width) * 100}
            >
              <NavigationFrame>
                <NavigationPanel />
              </NavigationFrame>
            </ResizablePanel>
            <ResizableHandle
              hitAreaMargins={{ coarse: 20, fine: 10 }}
              className="mr-2 w-0"
            />
          </>
        )}
        <ResizablePanel id="main" order={1}>
          <div className="h-full flex flex-col min-h-0">
            <RequestorPageContent />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

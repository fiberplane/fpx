// We need some special CSS for grid layout that tailwind cannot handle
import "./styles.css";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  usePanelConstraints,
} from "@/components/ui/resizable";
import { useIsLgScreen } from "@/hooks";
import PLACEGOOSE from "@/lib/placegoose.json";
import { cn } from "@/lib/utils";
import { NavigationFrame, NavigationPanel } from "./NavigationPanel";
import { RequestorPageContent } from "./RequestorPageContent";
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
  useRoutes();

  const { sidePanel } = useStudioStore("sidePanel");

  const width = getMainSectionWidth();
  const isLgScreen = useIsLgScreen();

  const { minSize, maxSize } = usePanelConstraints({
    groupId: "main-layout",
    initialGroupSize: width,
    minPixelSize: 320,
    minimalGroupSize: 944,
  });

  return (
    <div
      className={cn(
        "h-[calc(100vh-40px)]",
        "flex",
        "flex-col",
        "gap-2",
        "p-2",
        // "lg:gap-4",
      )}
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

export default RequestorPage;

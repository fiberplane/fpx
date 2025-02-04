import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  usePanelConstraints,
} from "@/components/ui/resizable";
import { useIsLgScreen, useKeySequence } from "@/hooks";
import { cn } from "@/utils";
import { useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { CommandBar } from "../CommandBar";
import { RequestPanel } from "../RequestPanel";
import { RequestorInput } from "../RequestorInput";
import { ResponsePanel } from "../ResponsePanel";
import { useMakeProxiedRequest } from "../queries";
import { useStudioStore } from "../store";
import { useRequestorSubmitHandler } from "../useRequestorSubmitHandler";
import { getMainSectionWidth } from "./util";

export const RequestorPageContent: React.FC = (_props) => {
  // const appRouteRef = useLatest<ProbedRoute | undefined>(appRoute);
  const {
    setShortcutsOpen,
    setActiveRequestsPanelTab,
    visibleRequestsPanelTabs,
  } = useStudioStore(
    "setShortcutsOpen",
    "setActiveRequestsPanelTab",
    "visibleRequestsPanelTabs",
  );

  const { mutate: makeRequest, isPending: isRequestorRequesting } =
    useMakeProxiedRequest();

  // Send a request when we submit the form
  const onSubmit = useRequestorSubmitHandler({
    makeRequest,
  });

  const formRef = useRef<HTMLFormElement>(null);

  useHotkeys(
    "mod+enter",
    () => {
      if (formRef.current) {
        formRef.current.requestSubmit();
      }
    },
    {
      enableOnFormTags: ["input"],
    },
  );

  const isLgScreen = useIsLgScreen();

  const [commandBarOpen, setCommandBarOpen] = useState(false);

  useHotkeys(
    "mod+k",
    (e) => {
      e.preventDefault();
      setCommandBarOpen(true);
    },
    {
      enableOnFormTags: ["input"],
    },
  );

  useHotkeys(
    "mod+/",
    () => {
      setShortcutsOpen(true);
    },
    {
      enableOnFormTags: ["input"],
    },
  );

  useKeySequence(
    ["g", "d"],
    () => {
      if (visibleRequestsPanelTabs.includes("docs")) {
        setActiveRequestsPanelTab("docs");
      }
    },
    { description: "View Route Docs", ignoreSelector: "[contenteditable]" },
  );

  useKeySequence(
    ["g", "p"],
    () => {
      if (visibleRequestsPanelTabs.includes("params")) {
        setActiveRequestsPanelTab("params");
      }
    },
    { description: "View Request Params", ignoreSelector: "[contenteditable]" },
  );

  useKeySequence(
    ["g", "a"],
    () => {
      if (visibleRequestsPanelTabs.includes("auth")) {
        setActiveRequestsPanelTab("auth");
      }
    },
    {
      description: "View Request Auth",
      ignoreSelector: "[contenteditable]",
    },
  );

  useKeySequence(
    ["g", "h"],
    () => {
      if (visibleRequestsPanelTabs.includes("headers")) {
        setActiveRequestsPanelTab("headers");
      }
    },
    {
      description: "View Request Headers",
      ignoreSelector: "[contenteditable]",
    },
  );

  useKeySequence(
    ["g", "b"],
    () => {
      // TODO - Focus the body input after this
      if (visibleRequestsPanelTabs.includes("body")) {
        setActiveRequestsPanelTab("body");
      }
    },
    { description: "View Request Body", ignoreSelector: "[contenteditable]" },
  );

  useKeySequence(
    ["g", "d"],
    () => {
      if (visibleRequestsPanelTabs.includes("docs")) {
        setActiveRequestsPanelTab("docs");
      }
    },
    { description: "View Route Docs", ignoreSelector: "[contenteditable]" },
  );

  const requestContent = <RequestPanel onSubmit={onSubmit} />;

  const responseContent = <ResponsePanel isLoading={isRequestorRequesting} />;

  const { minSize: requestPanelMinSize, maxSize: requestPanelMaxSize } =
    usePanelConstraints({
      // Change the groupId to `""` on small screens because we're not rendering
      // the resizable panel group
      groupId: "requestor-page-request-panel-group",
      initialGroupSize: getMainSectionWidth(),
      minPixelSize: 200,
      dimension: "width",
    });

  return (
    <div
      className={cn(
        "flex",
        "flex-col",
        "gap-2",
        "h-[calc(100%-0.6rem)]",
        "lg:h-full",
        "relative",
        "overflow-hidden",
      )}
    >
      <CommandBar open={commandBarOpen} setOpen={setCommandBarOpen} />
      <RequestorInput
        onSubmit={onSubmit}
        isRequestorRequesting={isRequestorRequesting}
        formRef={formRef}
      />
      <ResizablePanelGroup direction="vertical" id="content-panels">
        <ResizablePanel order={0} id="top-panels">
          <ResizablePanelGroup
            direction={isLgScreen ? "horizontal" : "vertical"}
            id="requestor-page-request-panel-group"
            className={cn("rounded-md", "max-w-screen", "max-h-full")}
          >
            <ResizablePanel
              order={1}
              className={cn("relative", "sm:border sm:border-r-none")}
              id="request-panel"
              minSize={
                requestPanelMinSize
                  ? Math.min(isLgScreen ? 100 : 20, requestPanelMinSize)
                  : undefined
              }
              maxSize={isLgScreen ? requestPanelMaxSize : undefined}
            >
              {requestContent}
            </ResizablePanel>
            <ResizableHandle
              hitAreaMargins={{ coarse: 20, fine: 10 }}
              className={cn(
                "bg-transparent",
                isLgScreen ? "cursor-col-resize" : "cursor-row-resize h-4",
              )}
            />
            <ResizablePanel
              id="response-panel"
              order={4}
              minSize={isLgScreen ? 10 : 15}
              className="sm:border sm:border-l-none"
            >
              {responseContent}
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

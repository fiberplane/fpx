import { KeyboardShortcutKey } from "@/components/KeyboardShortcut";
import { WebhoncBadge } from "@/components/WebhoncBadge";
import { Button } from "@/components/ui/button";
import { useProxyRequestsEnabled } from "@/hooks/useProxyRequestsEnabled";
import { useRequestorStore, useRequestorStoreRaw } from "@/pages/RequestorPage/store";
import { useOtelTrace } from "@/queries";
import { cn } from "@/utils";
import { Icon } from "@iconify/react/dist/iconify.js";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { useEffect, useState } from "react";
import { Branding } from "../Branding";
import { SettingsMenu, SettingsScreen } from "../Settings";
import { FloatingSidePanel } from "../SidePanel";
import { SidePanelTrigger } from "../SidePanel";
import { useShallow } from "zustand/react/shallow";
import { useOrphanLogs } from "@/hooks";
import { LogsToggle } from "./LogsToggle";
import { useActiveTraceId } from "@/hooks/useActiveTraceId";

export function BottomBar() {
  const shouldShowProxyRequests = useProxyRequestsEnabled();

  const [settingsOpen, setSettingsOpen] = useState(false);

  const {
    togglePanel,
  } = useRequestorStore(
    "togglePanel",
  );
  const activeBottomPanel = useRequestorStoreRaw(useShallow(state => {
    return state.bottomPanelIndex !== undefined ? state.bottomPanels[state.bottomPanelIndex] : undefined;
  }))

  const traceId = useActiveTraceId();
  // const { data: spans } = useOtelTrace(traceId);
  // const logs = useOrphanLogs(traceId, spans ?? []);

  // const hasErrorLogs = logs.some((log) => log.level === "error");

  // const logsPanel = (activeBottomPanel === "logsPanel") ? "open" : "closed";
  const timelinePanel = (activeBottomPanel === "timelinePanel") ? "open" : "closed";
  const aiPanel = (activeBottomPanel === "aiPanel") ? "open" : "closed";
  // useEffect(() => {
  //   if (hasErrorLogs && logsPanel !== "open") {
  //     togglePanel("logsPanel");
  //   }
  // }, [hasErrorLogs, logsPanel, togglePanel]);

  return (
    <nav className="gap-4 bg-muted/50 py-2">
      <div className="flex justify-between px-2 items-center">
        <div className="flex items-center gap-2 sm:static sm:h-auto border-0 bg-transparent text-sm">
          <SidePanelTrigger />
          <SettingsMenu setSettingsOpen={setSettingsOpen} />
          <FloatingSidePanel />
          <SettingsScreen
            settingsOpen={settingsOpen}
            setSettingsOpen={setSettingsOpen}
          />
          <Branding />
        </div>

        <div className="flex items-center gap-2">
          {shouldShowProxyRequests && (
            <div className="ml-2">
              <WebhoncBadge />
            </div>
          )}

          <LogsToggle traceId={traceId} />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => togglePanel("timelinePanel")}
                className={cn("h-6 w-6")}
              >
                <Icon
                  icon="lucide:align-start-vertical"
                  className={cn(
                    "cursor-pointer h-4 w-4",
                    timelinePanel === "open" && "text-blue-500",
                  )}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="bg-slate-900 text-white px-2 py-1.5 text-sm flex gap-2 items-center"
              align="center"
            >
              <p>Toggle timeline</p>
              <div className="flex gap-1 items-center">
                <KeyboardShortcutKey>G</KeyboardShortcutKey>
                <span className="text-xs font-mono">then</span>
                <KeyboardShortcutKey>T</KeyboardShortcutKey>
              </div>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => togglePanel("aiPanel")}
                className={cn("h-6 w-6")}
              >
                <Icon
                  icon="lucide:sparkles"
                  className={cn(
                    "cursor-pointer h-4 w-4",
                    aiPanel === "open" && "text-blue-500",
                  )}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="bg-slate-900 text-white px-2 py-1.5 text-sm flex gap-2 items-center"
              align="center"
            >
              <p>Toggle AI test panel</p>
              <div className="flex gap-1 items-center">
                <KeyboardShortcutKey>G</KeyboardShortcutKey>
                <span className="text-xs font-mono">then</span>
                <KeyboardShortcutKey>I</KeyboardShortcutKey>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </nav>
  );
}

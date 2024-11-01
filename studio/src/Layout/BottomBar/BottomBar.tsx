import { KeyboardShortcutKey } from "@/components/KeyboardShortcut";
import { WebhoncBadge } from "@/components/WebhoncBadge";
import { Button } from "@/components/ui/button";
import { useProxyRequestsEnabled } from "@/hooks/useProxyRequestsEnabled";
import {
  useRequestorStore,
  useRequestorStoreRaw,
} from "@/pages/RequestorPage/store";
import { cn } from "@/utils";
import { Icon } from "@iconify/react/dist/iconify.js";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { useHotkeys } from "react-hotkeys-hook";
import { useShallow } from "zustand/react/shallow";
import { Branding } from "../Branding";
import { LoggedInUser } from "../LoggedInUser";
import { PromptPanel, PromptToggle } from "../PromptPanel";
import { SettingsMenu, SettingsScreen } from "../Settings";
import { FloatingSidePanel } from "../SidePanel";
import { SidePanelTrigger } from "../SidePanel";
import { LogsToggle } from "./LogsToggle";

export function BottomBar() {
  const { settingsOpen, setSettingsOpen, promptPanel } = useRequestorStore(
    "settingsOpen",
    "setSettingsOpen",
    "promptPanel",
  );
  const shouldShowProxyRequests = useProxyRequestsEnabled();

  const { togglePanel } = useRequestorStore("togglePanel");
  const activeBottomPanel = useRequestorStoreRaw(
    useShallow((state) => {
      return state.bottomPanelIndex !== undefined
        ? state.bottomPanels[state.bottomPanelIndex]
        : undefined;
    }),
  );

  const timelinePanel =
    activeBottomPanel === "timelinePanel" ? "open" : "closed";
  const aiPanel = activeBottomPanel === "aiPanel" ? "open" : "closed";

  useHotkeys("mod+i", () => togglePanel("promptPanel"));

  return (
    <nav className="gap-4 bg-muted/50 py-2">
      <div className="grid grid-cols-[1fr,1fr,auto] justify-between px-2 items-center">
        <div className="flex items-center gap-2 sm:static sm:h-auto border-0 bg-transparent text-sm">
          <div className="flex items-center gap-2">
            <SidePanelTrigger />
            <SettingsMenu setSettingsOpen={setSettingsOpen} />
            <LoggedInUser />
          </div>
          <FloatingSidePanel />
          <SettingsScreen
            settingsOpen={settingsOpen}
            setSettingsOpen={setSettingsOpen}
          />
        </div>
        <div>
          <PromptToggle />
          {promptPanel === "open" && <PromptPanel />}
        </div>

        <div className="flex items-center gap-2">
          {shouldShowProxyRequests && (
            <div className="ml-2">
              <WebhoncBadge />
            </div>
          )}

          <LogsToggle />
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

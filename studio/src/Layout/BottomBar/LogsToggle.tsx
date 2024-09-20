import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import IconWithNotification from "@/components/IconWithNotification";
import { Button } from "@/components/ui/button";
import { useRequestorStore, useRequestorStoreRaw } from "@/pages/RequestorPage/store";
import { cn } from "@/utils";
import { useShallow } from "zustand/react/shallow";
import { KeyboardShortcutKey } from "@/components/KeyboardShortcut";
import { useOtelTrace } from "@/queries";
import { useOrphanLogs } from "@/hooks";

export function LogsToggle({ traceId }: { traceId?: string | null }) {
  if (traceId) {
    return <ToggleWithTraceId traceId={traceId} />
  }

  return <ToggleWithoutTraceId />;
}

function ToggleWithoutTraceId() {
  return <LogsToggleContent hasErrorLogs={false} />;
}


function ToggleWithTraceId({ traceId }: { traceId: string }) {
  const { data: spans } = useOtelTrace(traceId);
  const logs = useOrphanLogs(traceId, spans ?? []);
  const errorCount = logs.filter((log) => log.level === "error").length;
  return <LogsToggleContent errorCount={errorCount} />
}


function LogsToggleContent({ errorCount = 0 }: { errorCount: number }) {
  const { togglePanel } = useRequestorStore("togglePanel");
  const logsPanelVisible = useLogsPanelVisible();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => togglePanel("logsPanel")}
          className={cn("h-6 w-6")}
        >
          <IconWithNotification
            id="icon-with-error-notification"
            icon="lucide:square-terminal"
            notificationPosition="top-right"
            notificationColor="bg-red-700"
            notificationContent={errorCount}
            showNotification={errorCount > 0}
            notificationSize={10}
            className={cn(
              "cursor-pointer h-4 w-4",
              { "text-blue-500": logsPanelVisible, }
            )}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="bg-slate-900 text-white px-2 py-1.5 text-sm flex gap-2 items-center"
        align="center"
      >
        <p>Toggle logs</p>
        <div className="flex gap-1">
          <KeyboardShortcutKey>G</KeyboardShortcutKey>
          <span className="text-xs font-mono">then</span>
          <KeyboardShortcutKey>L</KeyboardShortcutKey>
        </div>
      </TooltipContent>
    </Tooltip>

  )
}

function useLogsPanelVisible() {
  return useRequestorStoreRaw(useShallow(state => {
    return state.bottomPanelIndex !== undefined && state.bottomPanels[state.bottomPanelIndex] === "logsPanel";
  }))
}

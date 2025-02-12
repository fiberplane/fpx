import IconWithNotification from "@/components/IconWithNotification";
import { KeyboardShortcutKey } from "@/components/KeyboardShortcut";
import { Button } from "@/components/ui/button";
import { useActiveTraceId, useOrphanLogs } from "@/hooks";
import { useStudioStore, useStudioStoreRaw } from "@/pages/RequestorPage/store";
import { useOtelTrace } from "@/queries";
import { cn } from "@/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

/**
 * Toggle for logs panel.
 */
export function LogsToggle() {
  const traceId = useActiveTraceId();
  if (traceId) {
    return <ToggleWithTraceId traceId={traceId} />;
  }

  return <ToggleWithoutTraceId />;
}

function ToggleWithoutTraceId() {
  return <LogsToggleContent errorCount={0} warningCount={0} />;
}

function ToggleWithTraceId({ traceId }: { traceId: string }) {
  const { data: spans } = useOtelTrace(traceId);
  const logs = useOrphanLogs(traceId, spans ?? []);
  const { error: errorCount, warn: warningCount } = useMemo(() => {
    return {
      error: logs.filter((log) => log.level === "error").length,
      warn: logs.filter((log) => log.level === "warn").length,
    };
  }, [logs]);

  return (
    <LogsToggleContent errorCount={errorCount} warningCount={warningCount} />
  );
}

function LogsToggleContent({
  errorCount = 0,
  warningCount = 0,
}: { errorCount?: number; warningCount?: number }) {
  const { togglePanel } = useStudioStore("togglePanel");
  const logsPanelVisible = useLogsPanelVisible();
  const notificationColor =
    errorCount > 0
      ? "bg-red-700"
      : warningCount > 0
        ? "bg-orange-300"
        : "bg-gray-500";
  const count = errorCount || warningCount;
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
            notificationColor={notificationColor}
            showNotification={count > 0}
            className={cn("cursor-pointer h-4 w-4", {
              "text-blue-500": logsPanelVisible,
            })}
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
  );
}

function useLogsPanelVisible() {
  return useStudioStoreRaw(
    useShallow((state) => {
      return (
        state.bottomPanelIndex !== undefined &&
        state.bottomPanels[state.bottomPanelIndex] === "logsPanel"
      );
    }),
  );
}

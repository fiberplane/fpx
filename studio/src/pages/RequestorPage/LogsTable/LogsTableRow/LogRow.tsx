import { LogContent } from "@/components/LogContent";
import {
  getBgColorForLevel,
  // getTextColorForLevel,
} from "@/components/Timeline/utils";
// import { Button } from "@/components/ui/button";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@/components/ui/tooltip";
// import { useCopyToClipboard } from "@/hooks";
import type { MizuOrphanLog } from "@/queries";
import { cn } from "@/utils";
// import { CopyIcon } from "@radix-ui/react-icons";
import { useState } from "react";

type LogRowProps = {
  log: MizuOrphanLog;
  showTimestamp?: boolean;
};

export function LogRow({ log, showTimestamp = true }: LogRowProps) {
  const bgColor = getBgColorForLevel(log.level);
  // const textColor = getTextColorForLevel(log.level);
  const [isExpanded, setIsExpanded] = useState(false);
  console.log("isExpanded", isExpanded);
  // we don't want the focus ring to be visible when the user is selecting the row with the mouse
  // const [isMouseSelected, setIsMouseSelected] = useState(false);
  // const { isCopied: isMessageCopied, copyToClipboard: copyMessageToClipboard } =
  // useCopyToClipboard();
  // const {
  //   isCopied: isArgumentsCopied,
  //   copyToClipboard: copyArgumentsToClipboard,
  // } = useCopyToClipboard();

  return (
    <div className={cn(bgColor, "hover:bg-muted")}>
      <LogContent
        log={log}
        showTimestamp={showTimestamp}
        isExpanded={isExpanded}
        toggleExpand={() => setIsExpanded(!isExpanded)}
      />
    </div>
  );
}

// export function getIconColor(level: MizuOrphanLog["level"]) {
//   switch (level) {
//     case "error":
//       return "bg-red-500";
//     case "warn":
//       return "bg-yellow-500";
//     case "info":
//       return "bg-blue-500";
//     case "debug":
//       return "bg-green-500";
//     default:
//       return "bg-gray-500";
//   }
// }

// export function formatTimestamp(timestamp: Date) {
//   return timestamp.toLocaleTimeString([], {
//     hour: "2-digit",
//     minute: "2-digit",
//     second: "2-digit",
//   });
// }

// import type { MizuOrphanLog } from "@/queries";

// type LogRowProps = {
//   log: MizuOrphanLog;
//   showIcon?: boolean;
//   showTimestamp?: boolean;
//   isExpanded?: boolean;
//   toggleExpand?: () => void;
// };

// export function LogContent({
//   log,
//   showTimestamp = true,
//   showIcon = true,
//   isExpanded = false,
//   toggleExpand,
// }: LogRowProps) {
//   return (
//     <div className={cn(isExpanded ? "rounded-t-xl" : "rounded-xl")}>
//       <div
//         tabIndex={toggleExpand && 0}
//         role="button"
//         onKeyDown={
//           toggleExpand &&
//           ((event) => {
//             if (event.key === "Enter") {
//               event.stopPropagation();
//               toggleExpand();
//             }
//           })
//         }
//         onClick={
//           toggleExpand &&
//           ((event) => {
//             event?.preventDefault();
//             event.stopPropagation();
//             toggleExpand();
//           })
//         }
//         className={cn(
//           toggleExpand &&
//           "cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-inset",
//           isExpanded ? "rounded-t-xl" : "rounded-xl",
//         )}
//       >
//         <LogContentHeader
//           logLevel={showIcon ? log.level : undefined}
//           message={log.message}
//           formattedTimestamp={
//             showTimestamp ? formatTimestamp(log.timestamp) : undefined
//           }
//         />
//       </div>
//       {isExpanded && (
//         <LogContentExpanded
//           level={log.level}
//           service={log.service}
//           message={log.message}
//           args={log.args}
//           callerLocations={log.callerLocations}
//         />
//       )}
//     </div>
//   );
// }
export { LogContent } from "./LogContent";
export { LogHeader } from "./LogHeader";
const iconColorMap: Record<string, string> = {
  error: "bg-red-500",
  warn: "bg-yellow-500",
  info: "bg-blue-500",
  debug: "bg-green-500",
};

export function getIconColor(level: string) {
  return iconColorMap[level] || "bg-gray-500";
}

export function formatTimestamp(timestamp: Date) {
  return `${timestamp.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })}.${timestamp.getMilliseconds().toString().padStart(3, "0")}`;
}

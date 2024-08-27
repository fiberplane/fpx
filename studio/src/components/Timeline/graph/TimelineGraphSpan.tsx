import type { OtelSpan } from "@/queries";
import { type VendorInfo, cn } from "@/utils";
import { useTimelineIcon, useTimelineTitle } from "./hooks";
import { formatDuration } from "./utils";

export const TimelineGraphSpan: React.FC<{
  span: OtelSpan;
  vendorInfo: VendorInfo;
  duration: number;
  startTime: number;
  isActive: boolean;
}> = ({ span, duration, vendorInfo, startTime, isActive }) => {
  const id = span.span_id;
  const spanDuration =
    new Date(span.end_time).getTime() - new Date(span.start_time).getTime();
  const normalizedDuration = spanDuration / duration;
  const percentageWidth =
    duration === 0 ? 100 : (normalizedDuration * 100).toFixed(4);
  const lineWidth = `calc(${4 * 0.0625}rem + ${percentageWidth}%)`;
  const lineOffsetNumeric =
    duration === 0
      ? 0
      : ((new Date(span.start_time).getTime() - startTime) / duration) * 100;
  const lineOffset = `calc(${lineOffsetNumeric.toFixed(4)}% - ${2 * 0.0625}rem)`;
  const icon = useTimelineIcon(span, { vendorInfo });
  const title = useTimelineTitle({ span, vendorInfo });

  return (
    <a
      data-toc-id={id}
      className={cn(
        "flex items-center p-2",
        "border-l-2 border-transparent",
        "hover:bg-primary/10 hover:border-blue-500",
        isActive && "bg-primary/10 border-blue-500",
        "transition-all",
        "cursor-pointer",
      )}
      href={`#${span.span_id}`}
    >
      <div className={cn(icon ? "mr-2" : "mr-0")}>{icon}</div>
      <div className="flex flex-col w-20 overflow-hidden">{title}</div>
      <div className="text-gray-400 flex flex-grow items-center mx-4 relative h-0.5">
        <div
          className={cn(
            "h-2.5 border-l-2 border-r-2 border-blue-500 flex items-center min-w-0 absolute",
          )}
          style={{ width: lineWidth, marginLeft: lineOffset }}
          title={`${span.start_time} - ${span.end_time}`}
        >
          <div className={"h-0.5 min-w-0.5 bg-blue-500 w-full"} />
        </div>
      </div>
      <div className="text-gray-400 text-xs w-12 px-2">
        {formatDuration(span.start_time, span.end_time)}
      </div>
    </a>
  );
};

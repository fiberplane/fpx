import { convertEventsToOrphanLogs } from "@/hooks/useOrphanLogs";
import { isMizuOrphanLog } from "@/types";
import { Element } from "./Element";
import { type SpanNode, getId } from "./utils";

export function TimelineTree({
  node: current,
  timelineVisible,
  minStart,
  duration,
  indent = 0,
  withLogs = true,
}: {
  node: SpanNode;
  timelineVisible: boolean;
  minStart: number;
  duration: number;
  indent?: number;
  withLogs?: boolean;
}) {
  const logs = current.item.span.events
    ? convertEventsToOrphanLogs(
        current.item.span.events,
        current.item.span.trace_id,
        current.item.span.span_id,
      )
    : [];

  const combined = [...current.children, ...logs].sort((a, b) => {
    const timeA = "item" in a ? a.item.span.start_time : a.timestamp;
    const timeB = "item" in b ? b.item.span.start_time : b.timestamp;
    if (timeA.getTime() === timeB.getTime()) {
      // If the times are the same, we need to sort giving the priority to the root span
      if ("item" in a && a?.item?.span?.name === "request") {
        return -1;
      }
      if ("item" in b && b?.item?.span?.name === "request") {
        return 1;
      }

      // If the time stamp is the same, sort on span_id/parent_span_id
      // TODO: improve further sorting.
      if ("item" in a && "item" in b) {
        if (a.item.span.span_id === b.item.span.parent_span_id) {
          return -1;
        }
        if (b.item.span.span_id === a.item.span.parent_span_id) {
          return 1;
        }
      }
    }
    return new Date(timeA).getTime() - new Date(timeB).getTime();
  });

  return (
    <>
      <Element
        item={current.item}
        timelineVisible={timelineVisible}
        minStart={minStart}
        duration={duration}
        indent={Math.max(0, indent)}
      />
      {combined.map((item) =>
        isMizuOrphanLog(item) ? (
          withLogs &&
          !item.isException && (
            <Element
              key={getId(item)}
              item={item}
              timelineVisible={timelineVisible}
              minStart={minStart}
              duration={duration}
              indent={indent + 1}
            />
          )
        ) : (
          <TimelineTree
            key={getId(item)}
            node={item}
            timelineVisible={timelineVisible}
            minStart={minStart}
            duration={duration}
            indent={indent + 1}
            withLogs={withLogs}
          />
        ),
      )}
    </>
  );
}

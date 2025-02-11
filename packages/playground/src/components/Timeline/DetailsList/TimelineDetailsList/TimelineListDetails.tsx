import { useStudioStore } from "@/components/playground/store";
import { Switch } from "@/components/ui/switch";
import { useIsMdScreen } from "@/hooks";
import { isMizuOrphanLog } from "@/types";
import type { Waterfall } from "@/utils";
import { memo, useMemo } from "react";
import { Element } from "./Element";
import { TimelineTree } from "./TimelineTree";
import { convertToTree, getId } from "./utils";

function TimelineListDetailsComponent({
  waterfall,
  minStart,
  duration,
}: {
  waterfall: Waterfall;
  minStart: number;
  duration: number;
}) {
  const {
    timelineAsTree: asTree,
    toggleTimelineAsTree: setAsTree,
    timelineShowLogs: withLogs,
    toggleTimelineLogs: setWithLogs,
  } = useStudioStore(
    "toggleTimelineAsTree",
    "timelineAsTree",
    "toggleTimelineLogs",
    "timelineShowLogs",
  );
  const isMdScreen = useIsMdScreen();
  const tree = useMemo(
    () => (asTree ? convertToTree(waterfall) : null),
    [waterfall, asTree],
  );

  return (
    <div className="grid gap-0 min-h-0 mt-0">
      <div className="flex gap-12 border-b pb-2">
        <label
          className="flex items-center space-x-2 cursor-pointer"
          htmlFor="tree-view-switch"
        >
          <span className="text-xs text-muted-foreground ">Tree view</span>
          <Switch
            id="tree-view-switch"
            checked={asTree}
            onCheckedChange={() => {
              setAsTree();
            }}
          />
        </label>

        <label
          className="flex items-center space-x-2 cursor-pointer"
          htmlFor="logs-switch"
        >
          <span className="text-xs text-muted-foreground ">Logs</span>
          <Switch
            id="logs-switch"
            checked={withLogs}
            onCheckedChange={() => {
              setWithLogs();
            }}
          />
        </label>
      </div>
      <div className="grid overflow-auto min-h-0">
        {asTree
          ? tree && (
              <TimelineTree
                node={tree}
                timelineVisible={isMdScreen}
                minStart={minStart}
                duration={duration}
                indent={0}
                withLogs={withLogs}
              />
            )
          : waterfall.map((item) => {
              const isLog = isMizuOrphanLog(item);
              return (isLog && withLogs && !item.isException) || !isLog ? (
                <Element
                  item={item}
                  timelineVisible={isMdScreen}
                  key={getId(item)}
                  minStart={minStart}
                  duration={duration}
                />
              ) : null;
            })}
      </div>
    </div>
  );
}

export const TimelineListDetails = memo(TimelineListDetailsComponent);

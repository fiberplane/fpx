import { Switch } from "@/components/ui/switch";
import { useIsMdScreen } from "@/hooks";
import { isMizuOrphanLog } from "@/queries";
import type { Waterfall } from "@/utils";
import { memo, useMemo, useState } from "react";
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
  const [asTree, setAsTree] = useState(true);
  const [withLogs, setWithLogs] = useState(true);
  const [withSpans, setWithSpans] = useState(true);

  // const asTree = false;
  const isMdScreen = useIsMdScreen();

  const tree = useMemo(() => convertToTree(waterfall), [waterfall]);

  return (
    <div className="grid gap-4 min-h-0 mt-0">
      <div className="flex gap-12 border-b pb-2">
        <label className="flex items-center space-x-2 cursor-pointer">
          <span className="text-xs text-muted-foreground ">Tree view</span>
          <Switch
            checked={asTree && withSpans}
            onCheckedChange={(checked) => {
              setAsTree(checked);
              if (checked && !withSpans) {
                setWithSpans(true);
              }
            }}
          />
        </label>

        <label className="flex items-center space-x-2 cursor-pointer">
          <span className="text-xs text-muted-foreground ">Logs</span>
          <Switch
            checked={withLogs}
            onCheckedChange={(checked) => {
              setWithLogs(checked);
            }}
          />
        </label>
      </div>
      <div className="grid overflow-auto min-h-0">
        {asTree && withSpans
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
              if (isLog) {
                console.log("log", item);
              }
              return (isLog && withLogs && !item.isException) ||
                (!isLog && withSpans) ? (
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

import { getIconColor } from "@/components/Log";
import { SpanStatus } from "@/constants";
import { isMizuOrphanLog } from "@/queries";
import type { Waterfall } from "@/utils";
import { useTimelineIcon } from "../../hooks";
import { getBgColorForLevel } from "../../utils";

export function ItemIcon({ item }: { item: Waterfall[0] }) {
  const isLog = isMizuOrphanLog(item);
  const vendorInfo = !isLog ? item.vendorInfo : undefined;
  const colorOverride = isLog
    ? getBgColorForLevel(item.level)
    : item.span.status?.code === SpanStatus.ERROR
      ? "text-red-500"
      : "text-blue-500";
  const icon = useTimelineIcon(isLog ? item : item.span, {
    vendorInfo,
    colorOverride,
  });

  if (isLog) {
    return (
      <div
        className={`w-2 h-2 flex-shrink-0 rounded-[15%] ${getIconColor(item.level)}`}
      />
    );
  }

  return icon;
}

import { type MizuOrphanLog, type OtelSpan, isMizuOrphanLog } from "@/queries";
import type { VendorInfo } from "@/utils";
import { useMemo } from "react";
import { getTypeIcon } from "../utils";

type IconOptions = {
  vendorInfo?: VendorInfo;
  colorOverride?: string;
};

export const useTimelineIcon = (
  spanOrLog: OtelSpan | MizuOrphanLog,
  options: IconOptions = {},
) => {
  const { vendorInfo, colorOverride } = options;
  return useMemo(() => {
    let iconType = isMizuOrphanLog(spanOrLog) ? "log" : spanOrLog.kind;
    if (vendorInfo && vendorInfo.vendor !== "none") {
      iconType = vendorInfo.vendor;
    }

    return getTypeIcon(iconType, colorOverride);
  }, [spanOrLog, vendorInfo, colorOverride]);
};

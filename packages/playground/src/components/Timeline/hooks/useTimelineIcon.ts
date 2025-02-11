import { type MizuOrphanLog, isMizuOrphanLog } from "@/types";
import { type VendorInfo, isCloudflareVendorInfo } from "@/utils";
import type { OtelSpan } from "@fiberplane/fpx-types";
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
      if (isCloudflareVendorInfo(vendorInfo)) {
        iconType = `${vendorInfo.vendor}-${vendorInfo.type}`;
      } else {
        iconType = vendorInfo.vendor;
      }
    }

    return getTypeIcon(iconType, colorOverride);
  }, [spanOrLog, vendorInfo, colorOverride]);
};

import { type MizuOrphanLog, isMizuOrphanLog } from "@/queries";
import { type VendorInfo, isCloudflareVendorInfo } from "@/utils";
import { useMemo } from "react";
import { getTypeIcon } from "../utils";
import type { OtelSpan } from "@fiberplane/fpx-types";

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

import { Badge } from "@/components/ui/badge";
import {
  isAnthropicVendorInfo,
  isFetchSpan,
  isNeonVendorInfo,
  isOpenAIVendorInfo,
  safeParseJson,
  Waterfall,
} from "@/utils";
import { useMemo } from "react";
import { cn } from "@/utils";
import { SpanKind } from "@/constants";

export const useTimelineTitle = (waterfallItem: Waterfall[0]) => {
  return useMemo(() => {
    if ("vendorInfo" in waterfallItem) {
      const { span, vendorInfo } = waterfallItem;
      const isNeonCall = isNeonVendorInfo(vendorInfo);
      if (isNeonCall) {
        return (
          <div
            className={cn(
              "uppercase",
              "font-normal",
              "font-mono",
              "text-xs",
              "truncate",
            )}
          >
            DB Query
            {/* {vendorInfo.sql?.query?.slice(0, 30)} */}
          </div>
        );
      }

      const isOpenAICall = isOpenAIVendorInfo(vendorInfo);
      if (isOpenAICall) {
        return (
          <div
            className={cn("font-normal", "font-mono", "text-xs", "truncate")}
          >
            OpenAI Call
          </div>
        );
      }

      const isAnthropicCall = isAnthropicVendorInfo(vendorInfo);
      if (isAnthropicCall) {
        return (
          <div
            className={cn("font-normal", "font-mono", "text-xs", "truncate")}
          >
            Anthropic Call
          </div>
        );
      }

      const isRootRequest = span.kind === SpanKind.SERVER;
      if (isRootRequest) {
        return (
          <div
            className={cn(
              "font-mono text-sm truncate",
              "text-gray-200",
              "capitalize",
            )}
          >
            {span.name}
          </div>
        );
      }

      const isFetch = isFetchSpan(span);
      if (isFetch) {
        return (
          <div>
            <Badge
              variant="outline"
              className={cn(
                "lowercase",
                "font-normal",
                "font-mono",
                "rounded",
                "px-1.5",
                "text-xs",
                "bg-orange-950/60 hover:bg-orange-950/60 text-orange-400",
              )}
            >
              {span.name}
            </Badge>
          </div>
        );
      }

      return (
        <div className="font-mono font-normal text-xs truncate text-gray-200">
          {span.name}
        </div>
      );
    }

    const message = waterfallItem.message
      ? safeParseJson(waterfallItem.message)
      : "log";
    return (
      <div className="font-mono font-normal text-xs truncate text-gray-200">
        {typeof message === "string" ? message : "log"}
      </div>
    );
  }, [waterfallItem]);
};

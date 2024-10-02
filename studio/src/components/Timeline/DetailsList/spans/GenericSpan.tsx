// import { SpanStatus } from "@/constants";
import { LogContent } from "@/components/LogContent";
import { convertExceptionEventToOrphanLog } from "@/hooks/useOrphanLogs";
// import { SpanStatus } from "@/constants";
import {
  type VendorInfo,
  cn,
  getNumber,
  getString,
  isCloudflareVendorInfo,
  noop,
} from "@/utils";
import type { OtelSpan } from "@fiberplane/fpx-types";
import { useMemo } from "react";
// import { useTimelineIcon } from "../../hooks";
import { SectionHeading } from "../../shared";
import { SubSection, SubSectionHeading } from "../../shared";
import {
  formatDuration,
  getBgColorForLevel,
  // formatDuration,
  getCloudflareSpanName,
} from "../../utils";
import { KeyValueTable } from "../KeyValueTableV2";
import { CloudflareSpan } from "./CloudflareSpan";

type Props = {
  span: OtelSpan;
  vendorInfo: VendorInfo;
  isExpanded?: boolean;
};
export function GenericSpan({ span, vendorInfo, isExpanded }: Props) {
  const attributes = useMemo(() => {
    const attr: Record<string, string> = {};
    for (const key of Object.keys(span.attributes)) {
      const value = span.attributes[key];
      const isString = typeof value === "string";
      const isObject = !!value && typeof value === "object";
      if (isString || (isObject && "String" in value)) {
        attr[key] = getString(value);
      } else {
        attr[key] = getNumber(value).toString();
      }
    }
    return attr;
  }, [span]);
  // const icon = useTimelineIcon(span, {
  //   vendorInfo,
  //   colorOverride:
  //     span.status?.code === SpanStatus.ERROR ? "text-red-500" : "text-blue-500",
  // });
  const isCfSpan = isCloudflareVendorInfo(vendorInfo);
  const name = isCfSpan ? getCloudflareSpanName(span, vendorInfo) : span.name;
  // console.log('span', span)
  const exception = span.events?.find((event) => event.name === "exception");
  return (
    <div id={span.span_id}>
      <SectionHeading className="grid gap-2 grid-cols-[1fr] items-center min-h-[26px]">
        {/* <div className="flex items-center justify-center">{icon}</div> */}
        <div className="flex items-center gap-2 max-w-full text-muted-foreground">
          {name}
          {/* {span.status?.code === SpanStatus.ERROR && (
            <>
              &nbsp;
              <Badge className="ml-2 mr-2" variant={"destructive"}>
                Error
              </Badge>
            </>
          )} */}
          {/* <div className="text-gray-400 text-xs w-12 px-2 text-muted-foreground">
            {formatDuration(
              span.start_time.toISOString(),
              span.end_time.toISOString(),
            )}
          </div> */}
        </div>
      </SectionHeading>
      {isExpanded && (
        <div
          className="py-2 grid gap-4"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.stopPropagation();
            }
          }}
        >
          {exception && (
            // <div className={cn(
            //   getBgColorForLevel("error"),
            //   "rounded p-2"
            // )}>
            <SubSection
              className={cn(getBgColorForLevel("error"), "px-4 py-2 rounded")}
            >
              <SubSectionHeading>Exception Detail:</SubSectionHeading>
              <LogContent
                toggleExpand={noop}
                isExpanded
                showTimestamp
                showIcon={false}
                log={convertExceptionEventToOrphanLog(
                  span.trace_id,
                  1,
                  exception,
                  span.span_id,
                )}
              />
            </SubSection>
          )}
          <SubSection className="gap-0">
            <SubSectionHeading>Meta data</SubSectionHeading>
            <KeyValueTable
              className="mt-0"
              valueCellClassName="text-[10px]/3"
              keyCellClassName="text-[10px]/3"
              keyValue={{
                "Span ID": span.span_id,
                "Start Time": span.start_time.toString(),
                "End Time": span.end_time.toString(),
                Kind: span.kind,
                "Status Message": span.status?.message ?? "No message",
                "Parent Span ID": span.parent_span_id ?? "",
                Duration: formatDuration(
                  span.start_time.toISOString(),
                  span.end_time.toISOString(),
                ),
              }}
            />
          </SubSection>
          {isCfSpan ? (
            <CloudflareSpan span={span} vendorInfo={vendorInfo} />
          ) : (
            Object.keys(attributes).length > 0 && (
              <SubSection>
                <SubSectionHeading>Attributes</SubSectionHeading>
                <KeyValueTable keyValue={attributes} />
              </SubSection>
            )
          )}
        </div>
      )}
    </div>
  );
}

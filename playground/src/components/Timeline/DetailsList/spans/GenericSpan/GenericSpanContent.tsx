import { LogContent, LogHeader } from "@/components/Log";
import { SubSection, SubSectionHeading } from "@/components/Timeline/shared";
import {
  formatDuration,
  getBgColorForLevel,
} from "@/components/Timeline/utils";
import { convertExceptionEventToOrphanLog } from "@/hooks/useOrphanLogs";
import { type VendorInfo, cn, isCloudflareVendorInfo } from "@/utils";
import type { OtelSpan } from "@fiberplane/fpx-types";
import { useMemo } from "react";
import { KeyValueTable } from "../../KeyValueTableV2";
import { CloudflareSpan } from "../CloudflareSpan";

type Props = {
  vendorInfo: VendorInfo;
} & Pick<
  OtelSpan,
  | "trace_id"
  | "span_id"
  | "status"
  | "parent_span_id"
  | "start_time"
  | "end_time"
  | "attributes"
  | "events"
  | "kind"
>;

export function GenericSpanContent(props: Props) {
  const {
    vendorInfo,
    trace_id,
    attributes,
    end_time,
    parent_span_id,
    span_id,
    start_time,
    status,
    events,
    kind,
  } = props;
  const exceptionEvent = events?.find((event) => event.name === "exception");
  const exception =
    exceptionEvent &&
    convertExceptionEventToOrphanLog(trace_id, 1, exceptionEvent, span_id);
  const isCfSpan = isCloudflareVendorInfo(vendorInfo);

  const attributeMap: Record<string, string> = useMemo(() => {
    if (Object.keys(attributes).length === 0) {
      return {};
    }
    return Object.fromEntries(
      Object.entries(attributes).map(([key, value]) => {
        if (typeof value !== "string") {
          return [key, JSON.stringify(value)];
        }
        return [key, value];
      }),
    );
  }, [attributes]);

  const metaData = useMemo(() => {
    return {
      "Span ID": span_id,
      "Start Time": start_time.toLocaleString(),
      "End Time": end_time.toLocaleString(),
      Kind: kind,
      "Status Message": status?.message ?? "No message",
      "Parent Span ID": parent_span_id ?? "",
      Duration: formatDuration(
        start_time.toISOString(),
        end_time.toISOString(),
      ),
    };
  }, [span_id, start_time, end_time, kind, status, parent_span_id]);

  return (
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
        <SubSection
          className={cn(getBgColorForLevel("error"), "px-4 py-2 rounded")}
        >
          <SubSectionHeading>Exception Detail:</SubSectionHeading>
          <LogHeader
            message={exception.message}
            logLevel={exception.level}
            timestamp={exception.timestamp}
          />
          <LogContent
            args={exception.args}
            level={exception.level}
            message={exception.message}
            callerLocations={exception.callerLocations}
            service={exception.service}
          />
        </SubSection>
      )}

      {isCfSpan ? (
        <>
          <CloudflareSpan
            attributes={attributes}
            vendorInfo={vendorInfo}
            metadata={
              <SubSection className="gap-0">
                <KeyValueTable
                  className="mt-0"
                  valueCellClassName="text-[10px]/3"
                  keyCellClassName="text-[10px]/3"
                  keyValue={metaData}
                />
              </SubSection>
            }
          />
        </>
      ) : (
        <>
          <SubSection className="gap-0">
            <SubSectionHeading>Metadata</SubSectionHeading>
            <KeyValueTable
              className="mt-0"
              valueCellClassName="text-[10px]/3"
              keyCellClassName="text-[10px]/3"
              keyValue={metaData}
            />
          </SubSection>
          {Object.keys(attributes).length > 0 && (
            <SubSection>
              <SubSectionHeading>Attributes</SubSectionHeading>
              <KeyValueTable keyValue={attributeMap} />
            </SubSection>
          )}
        </>
      )}
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { SpanStatus } from "@/constants";
import {
  type VendorInfo,
  getNumber,
  getString,
  isCloudflareVendorInfo,
} from "@/utils";
import type { OtelSpan } from "@fiberplane/fpx-types";
import { useMemo } from "react";
import { useTimelineIcon } from "../../hooks";
import { SectionHeading } from "../../shared";
import { SubSection, SubSectionHeading } from "../../shared";
import { formatDuration, getCloudflareSpanName } from "../../utils";
import { KeyValueTable } from "../KeyValueTableV2";
import { CloudflareSpan } from "./CloudflareSpan";

export function GenericSpan({
  span,
  vendorInfo,
}: {
  span: OtelSpan;
  vendorInfo: VendorInfo;
}) {
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
  const icon = useTimelineIcon(span, {
    vendorInfo,
    colorOverride: "text-gray-400",
  });
  const isCfSpan = isCloudflareVendorInfo(vendorInfo);
  const name = isCfSpan ? getCloudflareSpanName(span, vendorInfo) : span.name;

  console.log("span", span);
  return (
    <div id={span.span_id}>
      <SectionHeading className="grid gap-2 grid-cols-[24px_1fr] items-center">
        <div className="flex items-center justify-center">{icon}</div>
        <div className="flex items-center gap-2 max-w-full text-muted-foreground">
          {name}
          {span.status?.code === SpanStatus.ERROR && (
            <>
              &nbsp;
              <Badge className="ml-2 mr-2" variant={"destructive"}>
                Error
              </Badge>
            </>
          )}
          <div className="text-gray-400 text-xs w-12 px-2 text-muted-foreground">
            {formatDuration(
              span.start_time.toISOString(),
              span.end_time.toISOString(),
            )}
          </div>
        </div>
      </SectionHeading>
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
  );
}

import { Badge } from "@/components/ui/badge";
import { SpanStatus } from "@/constants";
import type { OtelSpan } from "@/queries";
import { getNumber, getString } from "@/utils";
import { useMemo } from "react";
import { useTimelineIcon } from "../../hooks";
import { SectionHeading } from "../../shared";
import { SubSection, SubSectionHeading } from "../../shared";
import { formatDuration } from "../../utils";
import { KeyValueTable } from "../KeyValueTableV2";

export function GenericSpan({ span }: { span: OtelSpan }) {
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
  const icon = useTimelineIcon(span);
  return (
    <div id={span.span_id}>
      <SectionHeading className="grid gap-2 grid-cols-[auto_1fr] items-center">
        {icon}
        <div className="flex items-center gap-2 max-w-full">

          {span.name}
          {span.status?.code === SpanStatus.ERROR && (
            <>
              &nbsp;
              <Badge className="ml-2 mr-2" variant={"destructive"}>
                Error
              </Badge>
            </>
          )}
          <div className="text-gray-400 text-xs w-12 px-2">
            {formatDuration(span.start_time, span.end_time)}
          </div>
        </div>
      </SectionHeading>
      {Object.keys(attributes).length > 0 && (
        <SubSection>
          <SubSectionHeading>Attributes</SubSectionHeading>
          <KeyValueTable keyValue={attributes} />
        </SubSection>
      )}
    </div>
  );
}

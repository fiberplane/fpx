import { Badge } from "@/components/ui/badge";
import { SpanStatus } from "@/constants";
import { type OtelSpan, isMizuOrphanLog } from "@/queries";
import {
  type VendorInfo,
  type Waterfall,
  getNumber,
  getString,
  isFetchSpan,
  isIncomingRequestSpan,
} from "@/utils";
import { useMemo } from "react";
import { StackTrace } from "../StackTrace";
import { SectionHeading } from "../shared";
import { FetchSpan } from "./FetchSpan";
import { IncomingRequest } from "./IncomingRequest";
import { KeyValueTableV2 } from "./KeyValueTableV2";
import { OrphanLog } from "./OrphanLog";
import { SubSection, SubSectionHeading } from "./shared";

export function TraceDetailsV2({
  waterfall,
}: {
  waterfall: Waterfall;
}) {
  // TODO: merge spans and orphanLogs
  return (
    <div className="grid gap-4" id="trace-details-v2">
      {waterfall.map((item) => {
        if (isMizuOrphanLog(item)) {
          return <OrphanLog log={item} key={item.id} />;
        }

        return (
          <SpanDetails
            key={item.span.span_id}
            span={item.span}
            vendorInfo={item.vendorInfo}
          />
        );
      })}
    </div>
  );
}

function SpanDetails({
  span,
  vendorInfo,
}: { span: OtelSpan; vendorInfo: VendorInfo }) {
  if (isIncomingRequestSpan(span)) {
    return <IncomingRequest span={span} />;
  }

  if (isFetchSpan(span)) {
    return <FetchSpan span={span} vendorInfo={vendorInfo} />;
  }

  return <GenericSpan span={span} />;
}

function GenericSpan({ span }: { span: OtelSpan }) {
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

  return (
    <div id={span.span_id}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 my-4">
          <SectionHeading>
            <>
              {span.name}
              {span.status?.code === SpanStatus.ERROR && (
                <>
                  &nbsp;
                  <Badge className="ml-2 mr-2" variant={"destructive"}>
                    Error
                  </Badge>
                </>
              )}
            </>
          </SectionHeading>
        </div>
      </div>
      <SubSection>
        <SubSectionHeading>Attributes</SubSectionHeading>
        <KeyValueTableV2 keyValue={attributes} />
      </SubSection>
      {span.events.length > 0 && (
        <SubSection>
          <SubSectionHeading>Events</SubSectionHeading>
          <div className="px-4">
            {span.events.map((event, index) => {
              if (event.name === "log") {
                let args: Array<unknown> = [];
                try {
                  args = JSON.parse(getString(event.attributes.args));
                } catch {
                  // swallow error
                }

                return (
                  <OrphanLog
                    key={index}
                    log={{
                      args,
                      id: new Date(event.timestamp).getTime(),
                      timestamp: event.timestamp,
                      message: getString(event.attributes.message),
                      level: getString(event.attributes.level),
                      traceId: span.trace_id,
                      createdAt: event.timestamp,
                      updatedAt: event.timestamp,
                    }}
                  />
                );
              }

              if (event.name === "exception") {
                const stacktrace = getString(
                  event.attributes["exception.stacktrace"],
                );
                return (
                  <SubSection key={event.timestamp}>
                    <SubSectionHeading>
                      Exception:{" "}
                      {getString(event.attributes["exception.message"])}
                    </SubSectionHeading>
                    <StackTrace stackTrace={stacktrace} />
                  </SubSection>
                );
              }

              return (
                <div key={event.timestamp}>
                  <div>{event.name}</div>
                  <div>{JSON.stringify(event.attributes)}</div>
                </div>
              );
            })}
          </div>
        </SubSection>
      )}
    </div>
  );
}

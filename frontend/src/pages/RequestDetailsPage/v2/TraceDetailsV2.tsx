import {
  // MizuOrphanLog,
  // MizuSpan,
  // MizuTrace,
  // MizuTraceV2,
  OtelSpan,
  // isMizuLog,
  isMizuOrphanLog,
  // OtelSpans,
} from "@/queries";
// import {
//   isMizuFetchSpan,
//   isMizuRootRequestSpan,
//   isMizuSpan,
// } from "@/queries/traces-v2";
// import { cn } from "@/utils";
import { useMemo } from "react";
// import { SpanKind } from "@/constants";
import { Waterfall } from "../RequestDetailsPageV2/RequestDetailsPageV2Content";
import { SectionHeading } from "../shared";
import { FetchSpan } from "./FetchSpan";
import { IncomingRequest } from "./IncomingRequest";
import { KeyValueTableV2 } from "./KeyValueTableV2";
import { OrphanLog } from "./OrphanLog";
import {
  // getLevel,
  getNumber,
  //  getStack,
  getString,
  isFetchSpan,
  isIncomingRequestSpan,
} from "./otel-helpers";
import { SubSection, SubSectionHeading } from "./shared";
// import { LogLog } from "../LogLog";
import { VendorInfo } from "./vendorify-traces";

// export function TraceDetailsV2({ spans, orphanLogs }: {
//   spans: OtelSpans,
//   orphanLogs: MizuTraceV2["orphanLogs"],
//   // trace: MizuTraceV2
//  }) {
//   return (
//     <div className="grid gap-4" id="trace-details-v2">
//       {trace &&
//         trace?.waterfall.map((span) => {
//           if (isMizuSpan(span)) {
//             return <SpanDetails key={span.span_id} span={span} />;
//           }
//           const log = span;
//           return <OrphanLog key={log.id} log={log} />;
//         })}
//     </div>
//   );
// }
export function TraceDetailsV2({
  waterfall,
}: {
  waterfall: Waterfall;
}) {
  // TODO: merge spans and orphanLogs
  // console.log(orphanLogs);
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
  // return <div>Unknown Span</div>;
}

function GenericSpan({ span }: { span: OtelSpan }) {
  const attributes = useMemo(() => {
    const attr: Record<string, string> = {};
    for (const key of Object.keys(span.attributes)) {
      const value = span.attributes[key];
      if ("String" in value) {
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
          <SectionHeading>{span.name}</SectionHeading>
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
                  args = JSON.parse(getString(event.attributes["args"]));
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
                      message: getString(event.attributes["message"]),
                      // name: "log",
                      level: getString(event.attributes["level"]),
                      traceId: span.trace_id,
                      createdAt: event.timestamp,
                      updatedAt: event.timestamp,
                    }}
                  />
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

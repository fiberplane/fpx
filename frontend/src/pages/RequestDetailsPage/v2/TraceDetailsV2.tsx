import { MizuSpan, MizuTrace, MizuTraceV2, OtelSpan, OtelSpans } from "@/queries";
import {
  isMizuFetchSpan,
  isMizuRootRequestSpan,
  isMizuSpan,
} from "@/queries/traces-v2";
import { FetchSpan } from "./FetchSpan";
import { IncomingRequest } from "./IncomingRequest";
import { OrphanLog } from "./OrphanLog";
import { SectionHeading } from "../shared";
import { SubSection, SubSectionHeading } from "./shared";
import { useMemo } from "react";
import { getNumber, getString } from "./otel-helpers";
import { KeyValueTableV2 } from "./KeyValueTableV2";

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
export function TraceDetailsV2({ spans, orphanLogs }: { 
  spans: OtelSpans,
  orphanLogs: MizuTraceV2["orphanLogs"],
 }) {
  return (
    <div className="grid gap-4" id="trace-details-v2">
      {spans.map((span) => {
        return <SpanDetails key={span.span_id} span={span} />;
      })}
    </div>
  );
}

function SpanDetails({ span }: { span: OtelSpan }) {
  if (span.name === "request" && span.kind === "Server") {
    return <IncomingRequest span={span} />;
  }
  // if (isMizuRootRequestSpan(span)) {
    // return <IncomingRequest span={span} />;
  // }

  // if (isMizuFetchSpan(span)) {
    // return <FetchSpan span={span} />;
  // }
  if (span.kind === "Client" && span.name === "fetch") {
    return <FetchSpan span={span} />;
  }

  return <GenericSpan span={span} />;
  // return <div>Unknown Span</div>;
}

function GenericSpan({ span }: { span: OtelSpan }) {

  const attributes = useMemo(() => {
    console.log('span.attributes', span.attributes);
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
    // Object.keys(span.attributes);
  },[span]);

  // const logs = useMemo(() => {
  //   return span.events.map(event => ({
  //     name: event.timestamp,
  //     timestamp: event.timestamp,
  //     attributes: event.attributes,
  //   }));
  // }
  return (
    <div id={span.id}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 my-4">
          <SectionHeading>{span.name}</SectionHeading>
        </div>
      </div>
      <SubSection>
        <SubSectionHeading>
          Attributes
        </SubSectionHeading>
        <KeyValueTableV2 keyValue={attributes} />
      </SubSection>
      <SubSection>
        <SubSectionHeading>
          Events
        </SubSectionHeading>
        {span.events.map(event => {
          if (event.name === "log") {
            let args: Array<unknown> = [];
            try {
              args = JSON.parse(getString(event.attributes["args"]));
            } catch {
              // swallow error
            };
            return <OrphanLog log={
              {
                args,
                id: new Date(event.timestamp).getTime(),
                timestamp: event.timestamp,
                message: getString(event.attributes["message"]),
                // name: "log",
                level: getString(event.attributes["level"]),
                traceId: span.trace_id,
                createdAt: event.timestamp,
                updatedAt: event.timestamp,
              }
            } />;
          }
          
          return (
          <div key={event.timestamp}>
            <div>{event.name}</div>
            <div>{JSON.stringify(event.attributes)}</div>
          </div>
        );
        })}
      </SubSection>
    </div>
  );
}

function Log({event}: {event: OtelSpan["events"][0]}) {
  const { level, message, ...rest} = event.attributes;
  return (
    <div>
      <div className="grid gap-2 grid-cols-12">
      <div className="col-span-6">{event.name}</div>
      <div className="col-span-6">{getString(event.attributes["level"])}</div>
      <div className="col-span-">{getString(event.attributes["message"])}</div>
      <div className="col-span-12">{JSON.stringify(rest)}</div>

      </div>
    </div>
  );
}

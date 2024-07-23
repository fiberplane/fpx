import { MizuSpan, MizuTraceV2 } from "@/queries";
import {
  isMizuFetchSpan,
  isMizuRootRequestSpan,
  isMizuSpan,
} from "@/queries/traces-v2";
import { FetchSpan } from "./FetchSpan";
import { IncomingRequest } from "./IncomingRequest";
import { OrphanLog } from "./OrphanLog";

export function TraceDetailsV2({ trace }: { trace: MizuTraceV2 }) {
  return (
    <div className="grid gap-4" id="trace-details-v2">
      {trace?.logs &&
        trace?.waterfall.map((span) => {
          if (isMizuSpan(span)) {
            return <SpanDetails key={span.span_id} span={span} />;
          }
          const log = span;
          return <OrphanLog key={log.id} log={log} />;
        })}
    </div>
  );
}

function SpanDetails({ span }: { span: MizuSpan }) {
  if (isMizuRootRequestSpan(span)) {
    return <IncomingRequest span={span} />;
  }

  if (isMizuFetchSpan(span)) {
    return <FetchSpan span={span} />;
  }

  return <div>Unknown Span</div>;
}

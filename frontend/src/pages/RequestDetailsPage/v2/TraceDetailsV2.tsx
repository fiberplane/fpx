import { CardContent } from "@/components/ui/card";

// import { Status } from "@/components/ui/status";
import {
  MizuLog,
  MizuRequestEnd,
  MizuRequestStart,
  MizuSpan,
  MizuTraceV2,
} from "@/queries";
import {
  isMizuFetchSpan,
  isMizuRootRequestSpan,
  isMizuSpan,
} from "@/queries/traces-v2";
import {
  MizuFetchEnd,
  MizuFetchError,
  MizuFetchLoggingError,
  MizuFetchStart,
} from "@/queries/types";
import { z } from "zod";
import { FetchRequestErrorLog } from "../FetchRequestErrorLog";
import { FetchRequestLog } from "../FetchRequestLog";
import { FetchResponseErrorLog } from "../FetchResponseErrorLog";
import { FetchResponseLog } from "../FetchResponseLog";
import { LogLog } from "../LogLog";
import { RequestLog } from "../RequestLog";
import { ResponseLog } from "../ResponseLog";
import { FetchSpan } from "./FetchSpan";
import { IncomingRequest } from "./IncomingRequest";
import { OrphanLog } from "./OrphanLog";

export type TocItem = {
  id: string;
  title: string;
  status?: string | number;
  method?: string;
};

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

const LifecycleSchema = z
  .enum([
    "request",
    "response",
    "fetch_start",
    "fetch_end",
    "fetch_error",
    "fetch_logging_error",
  ])
  .optional();

const LogLevelSchema = z.enum(["debug", "info", "warn", "error"]);
export type LogLevel = z.infer<typeof LogLevelSchema>;

function SpanDetails({ span }: { span: MizuSpan }) {
  if (isMizuRootRequestSpan(span)) {
    return <IncomingRequest span={span} />;
  }

  if (isMizuFetchSpan(span)) {
    return <FetchSpan span={span} />;
  }

  return <div>Unknown Span</div>;
}

function LogDetails({ log }: { log: MizuLog }) {
  const { message } = log;

  const level = log?.level ?? LogLevelSchema.parse(log.level);

  const lifecycle =
    message &&
    typeof message === "object" &&
    "lifecycle" in message &&
    LifecycleSchema.parse(message?.lifecycle);

  if (lifecycle) {
    switch (lifecycle) {
      case "request":
        return (
          <RequestLog
            message={message as MizuRequestStart}
            logId={String(log.id)}
          />
        );

      case "response":
        return (
          <ResponseLog
            message={message as MizuRequestEnd}
            logId={String(log.id)}
          />
        );

      case "fetch_start":
        return (
          <FetchRequestLog
            message={message as MizuFetchStart}
            logId={String(log.id)}
          />
        );

      case "fetch_end":
        return (
          <FetchResponseLog
            message={message as MizuFetchEnd}
            logId={String(log.id)}
          />
        );

      case "fetch_error":
        return (
          <FetchResponseErrorLog
            message={message as MizuFetchError}
            logId={String(log.id)}
          />
        );

      case "fetch_logging_error":
        return (
          <FetchRequestErrorLog
            message={message as MizuFetchLoggingError}
            logId={String(log.id)}
          />
        );
    }
  }

  return (
    <LogLog
      message={message}
      level={level as LogLevel}
      logId={String(log.id)}
    />
  );
}

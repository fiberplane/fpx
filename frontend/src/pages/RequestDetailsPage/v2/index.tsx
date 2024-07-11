import { Card, CardContent } from "@/components/ui/card";

import { Status } from "@/components/ui/status";
import {
  MizuLog,
  MizuRequestEnd,
  MizuRequestStart,
  MizuTrace,
  MizuTraceV2,
} from "@/queries";
import {
  MizuFetchEnd,
  MizuFetchError,
  MizuFetchLoggingError,
  MizuFetchStart,
  isMizuErrorMessage,
  isMizuFetchErrorMessage,
  isMizuRequestEndMessage,
} from "@/queries/types";
import { z } from "zod";
import { FetchRequestErrorLog } from "../FetchRequestErrorLog";
import { FetchRequestLog } from "../FetchRequestLog";
import { FetchResponseErrorLog } from "../FetchResponseErrorLog";
import { FetchResponseLog } from "../FetchResponseLog";
import { LogLog } from "../LogLog";
import { RequestLog } from "../RequestLog";
import { ResponseLog } from "../ResponseLog";
import { TextOrJsonViewer } from "../TextJsonViewer";
import { FpxCard, RequestMethod, SectionHeading } from "../shared";

export type TocItem = {
  id: string;
  title: string;
  status?: string | number;
  method?: string;
};

export function SummaryV2({ trace }: { trace: MizuTraceV2 }) {
  const errors = trace?.logs
    .filter((log) => {
      return (
        isMizuErrorMessage(log.message) || isMizuFetchErrorMessage(log.message)
      );
    })
    .map((error) => {
      if (isMizuErrorMessage(error.message)) {
        return {
          name: error.message.name,
          message: error.message.message,
        };
      }

      if (isMizuFetchErrorMessage(error.message)) {
        return {
          name: error.message.statusText,
          message: error.message.body,
        };
      }
    });
  const hasErrors = errors.length > 0;

  const response = trace?.logs.find((log) =>
    isMizuRequestEndMessage(log.message),
  );

  const body = isMizuRequestEndMessage(response?.message)
    ? response?.message.body
    : undefined;

  return (
    <div className="grid gap-2 grid-rows-[auto_1fr] overflow-hidden">
      <SectionHeading>Summary</SectionHeading>
      <FpxCard className="bg-muted/20">
        <CardContent className="grid gap-4 grid-rows-[auto_1fr] p-4">
          <div className="flex gap-2 items-center">
            <Status statusCode={Number(trace?.status)} />
            <RequestMethod method={trace?.method} />
            <p className="text-sm font-mono">{trace?.path}</p>
          </div>
          <div className="grid gap-2 overflow-x-auto">
            <h4 className="uppercase text-xs text-muted-foreground">
              {hasErrors ? "ERRORS" : "RESPONSE"}
            </h4>
            {hasErrors ? (
              errors.map((error, idx) => (
                <a
                  className="block"
                  href={`#log-error-${error?.name}`}
                  key={idx}
                >
                  <Card
                    key={idx}
                    className="relative rounded bg-secondary hover:bg-secondary/75 text-sm font-mono"
                  >
                    <CardContent className="p-2 whitespace-pre-wrap">
                      {error?.name}: {error?.message}
                    </CardContent>
                  </Card>
                </a>
              ))
            ) : (
              <FpxCard>
                <CardContent className="p-2 bg-secondary rounded-sm">
                  {body && <TextOrJsonViewer text={body} collapsed />}
                </CardContent>
              </FpxCard>
            )}
          </div>
        </CardContent>
      </FpxCard>
    </div>
  );
}

export function TraceDetailsV2({ trace }: { trace: MizuTraceV2 }) {
  return (
    <div className="grid gap-4" id="trace-details">
      {trace?.logs &&
        trace?.logs.map((log) => (
          <FpxCard key={log.id} className="overflow-hidden">
            <CardContent className="p-4 bg-muted/40">
              <LogDetails key={log.id} log={log} />
            </CardContent>
          </FpxCard>
        ))}
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

  return <LogLog message={message} level={level as LogLevel} />; // TODO: figure out why Zod doesn't parse this into a string tagged union
}

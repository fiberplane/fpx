import { KeyboardShortcutKey } from "@/components/KeyboardShortcut";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Status } from "@/components/ui/status";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRequestDetails } from "@/hooks";
import {
  MizuLog,
  MizuRequestEnd,
  MizuRequestStart,
  MizuTrace,
  useMizuTraces,
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
import { cn } from "@/utils";
import { ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { FetchRequestErrorLog } from "./FetchRequestErrorLog";
import { FetchRequestLog } from "./FetchRequestLog";
import { FetchResponseErrorLog } from "./FetchResponseErrorLog";
import { FetchResponseLog } from "./FetchResponseLog";
import { LogLog } from "./LogLog";
import { Minimap } from "./Minimap";
import { RequestLog } from "./RequestLog";
import { ResponseLog } from "./ResponseLog";
import { TextOrJsonViewer } from "./TextJsonViewer";
import { FpxCard, RequestMethod, SectionHeading } from "./shared";
import { SummaryV2, TraceDetailsTimeline, TraceDetailsV2 } from "./v2";

export function RequestDetailsPage() {
  const { traceId } = useParams<{ traceId: string }>();
  const { trace, traceV2 } = useRequestDetails(traceId);
  const navigate = useNavigate();

  const [isInputFocused, setIsInputFocused] = useState(false);

  const handleFocus = (event: FocusEvent) => {
    if (event.target instanceof HTMLInputElement) {
      setIsInputFocused(true);
    }
  };
  const handleBlur = (event: FocusEvent) => {
    if (event.target instanceof HTMLInputElement) {
      setIsInputFocused(false);
    }
  };

  const { data: traces } = useMizuTraces();
  const currIdx = traces?.findIndex((t) => t.id === traceId);

  const handleNextTrace = () => {
    if (!traces || currIdx === undefined) return;

    if (currIdx === traces?.length - 1) {
      return;
    }

    navigate(`/requests/${traces[currIdx + 1].id}`);
  };

  const handlePrevTrace = () => {
    if (!traces || currIdx === undefined) return;
    if (currIdx === 0) {
      return;
    }
    navigate(`/requests/${traces[currIdx - 1].id}`);
  };

  useEffect(() => {
    document.addEventListener("focus", handleFocus, true);
    document.addEventListener("blur", handleBlur, true);
    return () => {
      document.removeEventListener("focus", handleFocus, true);
      document.removeEventListener("blur", handleBlur, true);
    };
  }, []);

  useHotkeys(["Escape"], () => {
    // catch all the cases where the user is in the input field
    // and we don't want to exit the page
    if (isInputFocused) {
      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLInputElement) {
        activeElement.blur();
      }
      return;
    }

    navigate("/requests");
  });

  useHotkeys(["J"], () => {
    handleNextTrace();
  });

  useHotkeys(["K"], () => {
    handlePrevTrace();
  });
  const [searchParams] = useSearchParams();
  const shouldRenderV2 = !!traceV2 && !!searchParams.get("v2");

  return (
    <div
      className={cn(
        "h-full",
        "relative",
        "overflow-hidden",
        "overflow-y-scroll",
        "grid grid-rows-[auto_1fr]",
        "px-2 pb-4",
        "sm:px-4 sm:pb-8",
        "md:px-6",
      )}
    >
      <div
        className={cn(
          "flex gap-4 items-center justify-between",
          "py-8",
          "sm:gap-6 sm:py-8",
        )}
      >
        <h2 className="text-2xl font-semibold">Request Details</h2>
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                disabled={currIdx === 0}
                onClick={handlePrevTrace}
              >
                <ChevronUpIcon className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="left"
              className="bg-slate-950 text-white"
              align="center"
            >
              Prev <KeyboardShortcutKey>K</KeyboardShortcutKey>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                disabled={!traces || currIdx === traces?.length - 1}
                onClick={handleNextTrace}
              >
                <ChevronDownIcon className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="bg-slate-950 text-white"
              align="center"
            >
              Next <KeyboardShortcutKey>J</KeyboardShortcutKey>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      <div
        className={cn(
          "grid gap-4",
          "sm:grid-cols-[auto_1fr] sm:gap-4",
          "md:gap-6",
        )}
      >
        <div
          className={
            shouldRenderV2
              ? cn(
                  "hidden",
                  "min-w-[300px]",
                  "xl:min-w-[360px]",
                  "2xl:min-w-[420px]",
                  "lg:block lg:sticky lg:top-4 self-start",
                )
              : cn(
                  "hidden sm:block sm:sticky sm:top-4 self-start",
                  "sm:w-[220px]",
                  "md:w-[280px]",
                )
          }
        >
          {shouldRenderV2 ? (
            <TraceDetailsTimeline trace={traceV2} />
          ) : (
            <Minimap trace={trace} />
          )}
        </div>
        <div
          className={cn(
            "grid items-center gap-4 overflow-x-auto relative",
            "sm:grid-rows-[auto_1fr]",
            shouldRenderV2 ? "max-lg:grid-rows-[auto_auto_1fr]" : "",
          )}
        >
          {shouldRenderV2 ? (
            <SummaryV2 trace={traceV2} />
          ) : trace ? (
            <Summary trace={trace} />
          ) : (
            <div className="w-full relative" />
          )}

          {shouldRenderV2 ? (
            <div className="w-full lg:hidden">
              <TraceDetailsTimeline trace={traceV2} />
            </div>
          ) : null}

          {shouldRenderV2 ? (
            <TraceDetailsV2 trace={traceV2} />
          ) : trace ? (
            <TraceDetails trace={trace} />
          ) : (
            <div className="w-full relative" />
          )}
        </div>
      </div>
    </div>
  );
}

export type TocItem = {
  id: string;
  title: string;
  status?: string | number;
  method?: string;
};

function Summary({ trace }: { trace: MizuTrace }) {
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

function TraceDetails({ trace }: { trace: MizuTrace }) {
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

const isLogLevel = (level: unknown): level is LogLevel => {
  return LogLevelSchema.safeParse(level).success;
};

function LogDetails({ log }: { log: MizuLog }) {
  const { message } = log;

  const level = isLogLevel(log.level) ? log.level : "info";

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
      level={level}
      args={log.args}
      logId={String(log.id)}
    />
  );
}

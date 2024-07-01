import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { useRequestDetails } from "@/hooks";
import { ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Status } from "@/components/ui/status";
import { useKeySequence } from "@/hooks";
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
import { useEffect, useState } from "react";
import { z } from "zod";
import { FetchRequestErrorLog } from "./FetchRequestErrorLog";
import { FetchRequestLog } from "./FetchRequestLog.1";
import { FetchResponseErrorLog } from "./FetchResponseErrorLog";
import { FetchResponseLog } from "./FetchResponseLog";
import { KeyValueTable } from "./KeyValueTable";
import { LogLog } from "./LogLog";
import { Minimap } from "./Minimap";
import { RequestLog } from "./RequestLog";
import { ResponseLog } from "./ResponseLog";
import { TextOrJsonViewer } from "./TextJsonViewer";
import { cn } from "@/utils";

export function RequestDetailsPage() {
  const { traceId } = useParams<{ traceId: string }>();
  const { trace } = useRequestDetails(traceId);
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

  useKeySequence(["Escape"], () => {
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

  return (
    <div className={cn(
      "h-full w-full",
      "relative",
      "overflow-hidden",
      "overflow-y-scroll",
      "px-2 sm:px-6",
      "grid grid-rows-[auto_1fr]",
    )}>
      <div className={cn(
        "flex gap-4 items-center",
        "py-8",
        "sm:gap-8 sm:py-10",
      )}>
        <h2 className="text-2xl font-semibold">Request Detail</h2>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            disabled={currIdx === 0}
            onClick={handlePrevTrace}
          >
            <ChevronUpIcon className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            disabled={!traces || currIdx === traces?.length - 1}
            onClick={handleNextTrace}
          >
            <ChevronDownIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className={cn(
        "grid grid-cols-[auto_1fr] gap-4 sm:gap-4 md:gap-6",
        "w-full"
      )}>
        <div className={cn(
          "hidden sm:block sm:sticky sm:top-4 self-start",
          "sm:w-[220px]",
          "md:w-[280px]",
        )}>
          <Minimap trace={trace} />
        </div>
        <div className={cn(
          "grid items-center gap-4 overflow-x-auto relative",
          "sm:max-w-full",
          "w-full",
          "sm:grid-rows-[auto_1fr]",
          "overflow-hidden"
        )}>
          <div className="w-full relative">
            {trace && <Summary trace={trace} />}
          </div>

          <div className="w-full relative">
            {trace ? <TraceDetails trace={trace} /> : null}
          </div>
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
    <div className="grid gap-4 max-w-full">
      <h3 className="text-xl font-semibold">Summary</h3>
      <Card className="bg-muted/20 max-w-full">
        <CardContent className="grid gap-4 p-4">
          <div className="flex gap-2 items-center">
            <Status statusCode={Number(trace?.status)} />
            <span className="text-primary text-sm">{trace?.method}</span>
            <p className="text-sm">{trace?.path}</p>
          </div>
          <h4 className="uppercase text-xs text-muted-foreground">
            {hasErrors ? "ERRORS" : "RESPONSE"}
          </h4>
          {hasErrors ? (
            errors.map((error, idx) => (
              <a className="block w-full" href={`#log-error-${error?.name}`} key={idx}>
                <Card
                  key={idx}
                  className="max-w-full w-full relative rounded bg-secondary hover:bg-secondary/75 text-sm font-mono"
                >
                  <CardContent className="p-2 overflow-x-hidden whitespace-normal w-full">
                    {error?.name}: {error?.message}
                  </CardContent>
                </Card>
              </a>
            ))
          ) : (
            <Card>
              <CardContent className="p-2 bg-secondary rounded-lg">
                {body && <TextOrJsonViewer text={body} collapsed />}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TraceDetails({ trace }: { trace: MizuTrace }) {
  return (
    <div className="grid gap-8" id="trace-details">
      {trace?.logs &&
        trace?.logs.map((log) => (
          <Card key={log.id}>
            <CardContent className="p-4 bg-muted/40">
              <LogDetails key={log.id} log={log} />
            </CardContent>
          </Card>
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
        return <RequestLog message={message as MizuRequestStart} />;

      case "response":
        return <ResponseLog message={message as MizuRequestEnd} />;

      case "fetch_start":
        return <FetchRequestLog message={message as MizuFetchStart} />;

      case "fetch_end":
        return <FetchResponseLog message={message as MizuFetchEnd} />;

      case "fetch_error":
        return <FetchResponseErrorLog message={message as MizuFetchError} />;

      case "fetch_logging_error":
        return (
          <FetchRequestErrorLog message={message as MizuFetchLoggingError} />
        );
    }
  }

  return <LogLog message={message} level={level as LogLevel} />; // TODO: figure out why Zod doesn't parse this into a string tagged union
}

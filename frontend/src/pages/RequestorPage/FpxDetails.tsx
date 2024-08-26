import { useOtelTrace } from "@/queries";
import { cn, isJson, objectWithKey } from "@/utils";
import { CodeIcon, LinkBreak2Icon } from "@radix-ui/react-icons";
import { useMemo } from "react";
import { useOrphanLogs } from "../RequestDetailsPage/RequestDetailsPageV2/useOrphanLogs";
import { useRequestWaterfall } from "../RequestDetailsPage/RequestDetailsPageV2/useRequestWaterfall";
import { TraceDetailsTimeline } from "../RequestDetailsPage/v2";
import { CollapsibleKeyValueTableV2 } from "../RequestDetailsPage/v2/KeyValueTableV2";
import {
  getRequestEnv,
  getString,
  isErrorLogEvent,
} from "../RequestDetailsPage/v2/otel-helpers";
import { Requestornator } from "./queries";

type FpxDetailsProps = {
  response?: Requestornator;
  className?: string;
};

export function FpxDetails({ response, className }: FpxDetailsProps) {
  const hasTrace = !!response?.app_responses?.traceId;
  return hasTrace ? (
    <TraceDetails response={response} className={className} />
  ) : (
    <NoTrace />
  );
}

type TraceDetailsProps = {
  response: Requestornator;
  className?: string;
};

function parseMessage(message: string, goToCodeEnabled = false) {
  if (isJson(message)) {
    const jsonMessage = JSON.parse(message);
    if (
      objectWithKey(jsonMessage, "name") &&
      objectWithKey(jsonMessage, "message")
    ) {
      const name = jsonMessage.name as string;
      const message = jsonMessage.message as string;
      // TODO - Implement this once we have file and line number info from logs
      let goToCode: null | React.ReactNode = null;
      if (goToCodeEnabled) {
        const file = "";
        const lineNumber = 171;
        const columnNumber = 2;

        goToCode = (
          <a
            className="text-xs text-primary underline-offset-4 hover:underline flex items-center gap-2"
            // vscode://file/path/to/my/file.md
            href={`vscode://file/${file.trim()}:${lineNumber}:${columnNumber}`}
          >
            <CodeIcon className="h-3.5 w-3.5" />
            Go to Code
          </a>
        );
      }
      return (
        <div className="flex flex-col gap-1">
          <span className="flex flex-col justify-center gap-1">
            <span className="font-semibold text-gray-200">{name}</span>
            <span className="text-gray-200">{message}</span>
          </span>
          {goToCode}
        </div>
      );
    }
  }
  return message;
}

function TraceDetails({ response, className }: TraceDetailsProps) {
  const traceId = response.app_responses.traceId;
  const { data: spans, error, isLoading } = useOtelTrace(traceId);
  const isNotFound = !spans && !error && !isLoading;

  const orphanLogs = useOrphanLogs(traceId, spans ?? []);
  const { waterfall } = useRequestWaterfall(spans ?? [], orphanLogs);

  const eventsForKvTable = useMemo(() => {
    const events = spans?.flatMap((span) => span.events ?? []) ?? [];
    return events.map((event) => {
      // TODO - Make better messages
      const isException = event.name?.toLowerCase() === "exception";
      const isError = isErrorLogEvent(event);
      const name = isException ? (
        <span className="text-red-300">Exception</span>
      ) : isError ? (
        <span className="text-red-300">Error</span>
      ) : (
        event.name
      );

      const stringMessage = getString(event.attributes.message);
      const message = stringMessage ? (
        parseMessage(stringMessage)
      ) : (
        <span className="text-gray-400 italic">No message</span>
      );
      return [name, message] as [
        string | React.ReactNode,
        string | React.ReactNode,
      ];
    });
  }, [spans]);

  if (isNotFound) {
    return <div>Trace not found</div>;
  }

  const requestSpan = spans?.find((span) => span.name === "request");
  const requestEnv = requestSpan ? getRequestEnv(requestSpan) : {};

  // TODO - Implement this in the middleware
  // const shouldShowSourceFunction = false;

  return (
    <div className={cn("mt-2", className)}>
      <div className="w-full">
        <TraceDetailsTimeline waterfall={waterfall} className="pt-0 -mt-2" />
      </div>
      <div className="pt-1 pb-2 border-t" />
      <CollapsibleKeyValueTableV2
        title="Events"
        keyValue={eventsForKvTable}
        defaultCollapsed={false}
        emptyMessage="There were no logs or events during this request"
        keyCellClassName="w-[72px] lg:w-[72px] lg:min-w-[72px]"
      />
      <div className="pt-1 pb-2 border-t" />
      <CollapsibleKeyValueTableV2
        title="Environment Vars"
        keyValue={requestEnv}
        defaultCollapsed
        sensitiveKeys={isSensitiveEnvVar}
        emptyMessage="No environment vars found"
        keyCellClassName="w-[96px] lg:w-[96px] lg:min-w-[96px]"
      />
    </div>
  );
}

function isSensitiveEnvVar(key: string) {
  if (!key) {
    return false;
  }
  if (key.includes("APIKEY")) {
    return true;
  }
  if (key.includes("API_KEY")) {
    return true;
  }
  if (key.includes("ACCESS")) {
    return true;
  }
  if (key.includes("AUTH_")) {
    return true;
  }
  if (key.includes("CREDENTIALS")) {
    return true;
  }
  if (key.includes("CERTIFICATE")) {
    return true;
  }
  if (key.includes("PASSPHRASE")) {
    return true;
  }
  if (key.includes("DATABASE_URL")) {
    return true;
  }
  if (key.includes("CONNECTION_STRING")) {
    return true;
  }
  if (key.includes("SECRET")) {
    return true;
  }
  if (key.includes("PASSWORD")) {
    return true;
  }
  if (key.includes("PRIVATE")) {
    return true;
  }
  if (key.includes("TOKEN")) {
    return true;
  }
  return false;
}

function NoTrace() {
  return (
    <div className="flex flex-col items-center justify-center text-gray-400 max-h-[600px] h-full w-full lg:mb-32">
      <div className="flex flex-col items-center justify-center p-4">
        <LinkBreak2Icon className="h-10 w-10 text-red-200" />
        <div className="mt-4 text-md text-white text-center">
          No trace found
        </div>
        <div className="mt-2 text-ms text-gray-400 text-center font-light">
          Could not correlate the request with application logs or traces
        </div>
      </div>
    </div>
  );
}

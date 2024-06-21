import { Button } from "@/components/ui/button";
import { isMizuRequestEndMessage, isMizuRequestStartMessage } from "@/queries";
import { cn } from "@/utils";
import { CaretSortIcon, LoopIcon } from "@radix-ui/react-icons";
import { useMemo, useState } from "react";
import { getHttpMethodTextColor } from "./method";
import { Requestornator, useTrace } from "./queries";

type RequestorHistoryProps = {
  history: Array<Requestornator>;
  loadHistoricalRequest: (traceId: string) => void;
};

export function RequestorHistory({
  history,
  loadHistoricalRequest,
}: RequestorHistoryProps) {
  return (
    <>
      {!history.length && (
        <div className="mt-2 text-sm border p-2 shadow rounded">
          No request history yet. Make a request to see it here.
        </div>
      )}
      {history
        .filter((h) => !!h)
        .map((h) => {
          const traceId = h.app_responses?.traceId;
          const requestMethod = h.app_requests?.requestMethod;
          const responseStatusCode = h.app_responses?.responseStatusCode;
          return (
            <HistoryEntry
              key={traceId}
              traceId={traceId}
              requestMethod={requestMethod}
              responseStatusCode={responseStatusCode}
              loadHistoricalRequest={loadHistoricalRequest}
            />
          );
        })}
    </>
  );
}

type HistoryEntryProps = {
  traceId: string;
  responseStatusCode: number | string;
  requestMethod: string;
  loadHistoricalRequest: (traceId: string) => void;
};

export function HistoryEntry({
  traceId,
  responseStatusCode,
  requestMethod,
  loadHistoricalRequest,
}: HistoryEntryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isLoading, isNotFound, trace } = useTrace(traceId);

  const requestBody = useMemo(() => {
    if (trace?.logs) {
      for (const log of trace.logs) {
        if (isMizuRequestStartMessage(log.message)) {
          return log.message.body;
        }
      }
    }
  }, [trace]);

  const responseBody = useMemo(() => {
    if (trace?.logs) {
      for (const log of trace.logs) {
        if (isMizuRequestEndMessage(log.message)) {
          return log.message.body;
        }
      }
    }
  }, [trace]);

  return (
    <div className="mt-2 border rounded py-2 px-1 shadow-sm text-sm">
      <div
        className="flex flex-col space-y-2 justify-center space-x-2 font-mono"
        onClick={() => setIsOpen((v) => !v)}
      >
        <div className="flex space-between cursor-pointer text-gray-300">
          <div className="flex space-x-2 items-center">
            <CaretSortIcon className="mx-1 w-3.5 h-3.5" />
            <StatusCode status={responseStatusCode} />
            <Method method={requestMethod} />
            <span
              className={cn(
                "pt-0.5", // HACK - to adjust baseline of mono font to look good next to sans
              )}
            >
              {isLoading
                ? "Loading"
                : isNotFound
                  ? "Details missing"
                  : trace?.path}
            </span>
          </div>
          <div className="flex items-center ml-auto mr-2">
            <Button
              size="sm"
              variant="ghost"
              className="px-2"
              onClick={(e) => {
                e.stopPropagation();
                loadHistoricalRequest(traceId);
              }}
            >
              <LoopIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isOpen && (
          <div className="flex flex-col space-y-2 pl-6 py-1">
            <div className="border-b py-1">
              <h3>Request</h3>
              {requestBody ? (
                <code className="text-gray-300 block my-1">{requestBody}</code>
              ) : (
                <div className="text-gray-400 block my-1 italic">
                  No request body
                </div>
              )}
            </div>
            <div className="py-1">
              <h3>Response</h3>
              <code className="text-gray-300 block my-1">{responseBody}</code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Method({ method }: { method: string }) {
  return (
    <span
      className={cn(
        "font-mono",
        "pt-0.5", // HACK - to adjust baseline of mono font to look good next to sans
        getHttpMethodTextColor(method?.toUpperCase?.()),
      )}
    >
      {method}
    </span>
  );
}

function StatusCode({ status }: { status: string | number }) {
  const strStatus = status?.toString() ?? "-";
  const isGreen = strStatus.startsWith("2");
  const isOrange = strStatus.startsWith("4");
  const isRed = strStatus.startsWith("5");

  return (
    <span
      className={cn(
        "rounded-md",
        "px-2",
        "py-1",
        "bg-opacity-30",
        "font-sans",
        isGreen && ["text-green-400", "bg-green-800"],
        isOrange && ["text-orange-400", "bg-orange-800"],
        isRed && ["text-red-400", "bg-red-800"],
      )}
    >
      {strStatus}
    </span>
  );
}

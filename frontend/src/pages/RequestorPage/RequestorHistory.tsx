import { isMizuRequestEndMessage, isMizuRequestStartMessage } from "@/queries";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { useMemo, useState } from "react";
import { Requestornator, useTrace } from "./queries";

type HistoricalRequest = {
  traceId: string;
  responseStatusCode: number | string;
};

type RequestorHistoryProps = {
  history: Array<Requestornator>;
};

export function RequestorHistory({ history }: RequestorHistoryProps) {
  // TODO - get trace ide
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
          const responseStatusCode = h.app_responses?.responseStatusCode;
          return (
            <HistoryEntry
              key={traceId}
              traceId={traceId}
              responseStatusCode={responseStatusCode}
            />
          );
        })}
    </>
  );
}

function HistoryEntry({ traceId, responseStatusCode }: HistoricalRequest) {
  const [isOpen, setIsOpen] = useState(false);
  const { isLoading, isNotFound, trace } = useTrace(traceId);

  // TODO - Get request body from trace

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
        <div className="flex space-x-2 items-center cursor-pointer text-gray-300">
          <CaretSortIcon className="mx-1 w-3.5 h-3.5" />
          <span>{responseStatusCode}</span>
          <span>
            {isLoading
              ? "Loading"
              : isNotFound
                ? "Details missing"
                : trace?.description}
          </span>
        </div>

        {isOpen && (
          <div className="flex flex-col space-y-1">
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

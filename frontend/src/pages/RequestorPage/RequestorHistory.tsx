import { CaretSortIcon } from "@radix-ui/react-icons"
import { useTrace } from "./queries"
import { useMemo, useState } from "react"
import { isMizuRequestEndMessage, isMizuRequestStartMessage } from "@/queries"

type HistoricalRequest = {
  traceId: string,
  responseStatusCode: number
}

type RequestorHistoryProps = {
  history: Array<HistoricalRequest>
}

export function RequestorHistory({ history }: RequestorHistoryProps) {
  // const { trace, isNotFound } = useTrace(traceId);

  return (
    <>
      {!history.length && (
        <div>
          No request history yet. Make a request to see it here.
        </div>
      )}
      {history.filter(h => !!h).map(h => {
        return (
          <HistoryEntry key={h.traceId} traceId={h.traceId} responseStatusCode={h.responseStatusCode} />
        )
      })}
    </>
  )
}

function HistoryEntry({ traceId, responseStatusCode }: HistoricalRequest) {
  const [isOpen, setIsOpen] = useState(false)
  const {
    isLoading,
    isNotFound,
    trace,
  } = useTrace(traceId);

  // TODO - Get request body from trace

  const requestBody = useMemo(() => {
    if (trace?.logs) {
      for (const log of trace.logs) {
        if (isMizuRequestStartMessage(log.message)) {
          return log.message.body
        }
      }
    }
  }, [trace])

  const responseBody = useMemo(() => {
    if (trace?.logs) {
      for (const log of trace.logs) {
        if (isMizuRequestEndMessage(log.message)) {
          return log.message.body
        }
      }
    }
  }, [trace])

  console.log("History trace:", trace)

  return (
    <div className="mt-2 border rounded py-2 px-1 shadow-sm">
      <div className="flex flex-col space-y-2 justify-center space-x-2 font-mono" onClick={() => setIsOpen(v => !v)}>
        <div className="flex space-x-2 items-center cursor-pointer">
          <CaretSortIcon className="mx-1 w-3.5 h-3.5" />
          <span>{responseStatusCode}</span>
          <span>
            {isLoading ? "Loading" : isNotFound ? "Details missing" : trace?.description}
          </span>
        </div>

        {isOpen && (
          <div className="flex flex-col space-y-1">
            <div className="border-b py-1">
              <h3>Request</h3>
              {
                requestBody ? (
                  <code className="text-gray-300 block my-1">
                    {requestBody}
                  </code>
                ) : (
                    <div className="text-gray-400 block my-1 italic">
                    No request body
                  </div>
                )
              }
            </div>
            <div className="py-1">
              <h3>Response</h3>
              <code className="text-gray-300 block my-1">
                {responseBody}
              </code>
            </div>
          </div>
        )}
      </div>
    </div>
  )

}
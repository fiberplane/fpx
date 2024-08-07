import { cn, parsePathFromRequestUrl, truncatePathWithEllipsis } from "@/utils";
import { getHttpMethodTextColor } from "./method";
import { Requestornator } from "./queries";

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
          const id = h.app_requests?.id;
          const traceId = h.app_responses?.traceId;
          return (
            <HistoryEntry
              key={`${traceId}-${id}`}
              traceId={traceId}
              response={h}
              loadHistoricalRequest={loadHistoricalRequest}
            />
          );
        })}
    </>
  );
}

type HistoryEntryProps = {
  traceId: string;
  response: Requestornator;
  loadHistoricalRequest?: (traceId: string) => void;
};

export function HistoryEntry({
  traceId,
  response,
  loadHistoricalRequest,
}: HistoryEntryProps) {
  const isFailure = response?.app_responses?.isFailure;
  const requestMethod = response.app_requests?.requestMethod;
  const responseStatusCode = response.app_responses?.responseStatusCode;

  const fallbackUrl = truncatePathWithEllipsis(
    parsePathFromRequestUrl(
      response.app_requests?.requestUrl,
      response.app_requests?.requestQueryParams ?? undefined,
    ),
  );

  return (
    <div className="mt-0.5 rounded py-1 px-1 pl-6 shadow-sm text-xs hover:bg-gray-800">
      <div
        className="flex flex-col space-y-2 justify-center space-x-2 font-mono"
        onClick={() => {
          loadHistoricalRequest?.(traceId);
        }}
      >
        <div className="flex space-between cursor-pointer text-gray-300">
          <div className="flex items-center gap-2 w-full">
            <Method method={requestMethod} />
            <div
              className={cn(
                "whitespace-nowrap",
                "overflow-ellipsis",
                "flex-grow",
                "pt-0.5", // HACK - to adjust baseline of mono font to look good next to sans
              )}
            >
              {isFailure
                ? fallbackUrl || "Request failed to send"
                : fallbackUrl || "Details missing"}
            </div>
            <div className="flex items-center ml-auto">
              <StatusCode status={responseStatusCode} isFailure={isFailure} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Method({ method }: { method: string }) {
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

export function StatusCode({
  status,
  isFailure,
}: { status: string | number; isFailure: boolean }) {
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
        (isRed || isFailure) && ["text-red-400", "bg-red-800"],
      )}
    >
      {isFailure ? "Fail" : strStatus}
    </span>
  );
}

import {
  cn,
  getHttpMethodTextColor,
  parsePathFromRequestUrl,
  truncatePathWithEllipsis,
} from "@/utils";
import type { Requestornator } from "./queries";
import { useServiceBaseUrl } from "./store";

type RequestorHistoryProps = {
  history: Array<Requestornator>;
  loadHistoricalRequest: (traceId: string) => void;
};

export function RequestorHistory({
  history,
  loadHistoricalRequest,
}: RequestorHistoryProps) {
  const { removeServiceUrlFromPath } = useServiceBaseUrl();
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
              removeServiceUrlFromPath={removeServiceUrlFromPath}
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
  removeServiceUrlFromPath: (path: string) => string;
};

export function HistoryEntry({
  traceId,
  response,
  loadHistoricalRequest,
  removeServiceUrlFromPath,
}: HistoryEntryProps) {
  const isFailure = response?.app_responses?.isFailure;
  const requestMethod = response.app_requests?.requestMethod;
  const responseStatusCode = response.app_responses?.responseStatusCode;

  const path = parsePathFromRequestUrl(
    response.app_requests?.requestUrl,
    response.app_requests?.requestQueryParams ?? undefined,
    { preserveHost: true },
  );

  const fallbackUrl = truncatePathWithEllipsis(
    path ? removeServiceUrlFromPath(path) : path,
  );

  return (
    <div className="rounded py-1 px-1 pl-5 shadow-sm text-xs text-gray-200 hover:bg-gray-800 hover:text-white">
      <div
        className="flex flex-col space-y-2 justify-center space-x-2 font-mono"
        onKeyUp={(e) => {
          if (e.key === "Enter") {
            loadHistoricalRequest?.(traceId);
          }
        }}
        onClick={() => {
          loadHistoricalRequest?.(traceId);
        }}
      >
        <div className="flex space-between cursor-pointer ">
          <div className="flex items-center gap-2 w-full">
            <Method method={requestMethod} className="text-xs min-w-12" />
            <div
              className={cn(
                "whitespace-nowrap",
                "overflow-hidden",
                "text-ellipsis",
                "max-w-full",
                "flex-grow",
                "text-sm ",
                "pt-0.5", // HACK - to adjust baseline of mono font to look good next to sans
              )}
            >
              {isFailure
                ? fallbackUrl || "Request failed to send"
                : fallbackUrl || "Details missing"}
            </div>
            <div className="flex items-center ml-auto">
              <StatusCode
                status={responseStatusCode}
                isFailure={isFailure}
                className="text-xs"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Method({
  method,
  className,
}: { method: string; className?: string }) {
  return (
    <span
      className={cn(
        "font-mono",
        "pt-0.5", // HACK - to adjust baseline of mono font to look good next to sans
        getHttpMethodTextColor(method?.toUpperCase?.()),
        className,
      )}
    >
      {method}
    </span>
  );
}

export function StatusCode({
  status,
  isFailure,
  className,
}: { status: string | number; isFailure: boolean; className?: string }) {
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
        "text-xs",
        "bg-opacity-30",
        "font-sans",
        isGreen && ["text-green-400", "bg-green-800"],
        isOrange && ["text-orange-400", "bg-orange-800"],
        (isRed || isFailure) && ["text-red-400", "bg-red-800"],
        className,
      )}
    >
      {isFailure ? "Fail" : strStatus}
    </span>
  );
}

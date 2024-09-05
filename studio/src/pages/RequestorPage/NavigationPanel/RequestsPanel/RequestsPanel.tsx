import { RequestMethod } from "@/components/Timeline";
import { Input } from "@/components/ui/input";
import { Status } from "@/components/ui/status";
import { type OtelTrace, useOtelTraces } from "@/queries";
import {
  cn,
  getRequestMethod,
  getRequestPath,
  getRequestUrl,
  getStatusCode,
} from "@/utils";
import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import type { Requestornator } from "../../queries";
import { useRequestorStore, useServiceBaseUrl } from "../../store";
import { useRequestorHistory } from "../../useRequestorHistory";

export function RequestsPanel() {
  const { history } = useRequestorHistory();
  const { data: traces = [] } = useOtelTraces();
  const items = useMemo(() => mergeLists(history, traces), [history, traces]);

  const [filterValue, setFilterValue] = useState("");
  const filteredItems = items.filter((item) => {
    if (item.type === "request") {
      return item.data.app_requests.requestUrl.includes(filterValue);
    }
    return item.data.spans.some((span) =>
      getRequestPath(span).includes(filterValue),
    );
  });

  return (
    <div>
      <div className="flex items-center space-x-2 pb-3">
        <Input
          className="text-sm"
          placeholder="Search requests"
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
        />
      </div>
      <div className="overflow-y-auto relative">
        {filteredItems.map((item) => (
          <NavItem key={getId(item)} item={item} />
        ))}
      </div>
    </div>
  );
}

const NavItem = ({ item }: { item: MergedListItem }) => {
  const [params] = useSearchParams();
  const { activeHistoryResponseTraceId } = useRequestorStore(
    "activeHistoryResponseTraceId",
  );
  const { id = activeHistoryResponseTraceId } = useParams();

  return (
    <Link
      to={{
        pathname: `/requestor/otel/${getId(item)}`,
        search: params.toString(),
      }}
      className={cn(
        "grid grid-cols-[38px_38px_1fr] gap-2 hover:bg-muted p-2 rounded cursor-pointer",
        {
          "bg-muted": id === getId(item),
        },
      )}
    >
      <div>
        <StatusCell item={item} />
      </div>
      <div>
        <MethodCell item={item} />
      </div>
      <div>
        <PathCell item={item} />
      </div>
    </Link>
  );
};

const getId = (item: MergedListItem) => {
  return item.type === "request"
    ? item.data.app_responses.traceId
    : item.data.traceId;
};

/**
         <DataTable
          columns={columns}
          data={filteredItems ?? []}
        // handleRowClick={handleRowClick}
        // getPaginationRowModel={getPaginationRowModel<OtelTrace>}
        />
 */

function getSpan(trace: OtelTrace) {
  return (
    trace.spans.find(
      // (item) => item.span.parent_span_id === null,
      (item) => item.name === "request",
    ) || trace.spans[0]
  );
}

const PathCell = ({ item }: { item: MergedListItem }) => {
  const { removeServiceUrlFromPath } = useServiceBaseUrl();
  const path =
    item.type === "request"
      ? removeServiceUrlFromPath(item.data.app_requests.requestUrl)
      : removeServiceUrlFromPath(getRequestUrl(getSpan(item.data)));

  return <div>{path}</div>;
};

const StatusCell = ({ item }: { item: MergedListItem }) => {
  const code =
    item.type === "request"
      ? Number.parseInt(item.data.app_responses.responseStatusCode)
      : getStatusCode(getSpan(item.data));
  return <Status statusCode={code} />;
};

const MethodCell = ({ item }: { item: MergedListItem }) => {
  const method =
    item.type === "request"
      ? item.data.app_requests.requestMethod
      : getRequestMethod(getSpan(item.data));
  return <RequestMethod method={method} />;
};

type MergedListItem =
  | {
      type: "request";
      data: Requestornator;
    }
  | {
      type: "history";
      data: OtelTrace;
    };

// Combine the history with traces by creating a new list that contains the history as well
// as traces that are not in the history. The new list should be sorted by the timestamp of the request.
// and contain a type property to distinguish between history and traces
function mergeLists(
  history: Requestornator[],
  traces: OtelTrace[],
): Array<MergedListItem> {
  const mergedList: MergedListItem[] = [
    ...history.map((item): MergedListItem => ({ type: "request", data: item })),
    ...traces
      .filter(
        (trace) =>
          !history.some((h) => h.app_responses.traceId === trace.traceId),
      )
      .map((item): MergedListItem => {
        return { type: "history", data: item };
      }),
  ];

  return mergedList.sort((a, b) => {
    const aTime =
      a.type === "request"
        ? new Date(a.data.app_requests.updatedAt).getTime()
        : new Date(a.data.spans[0].start_time).getTime();
    const bTime =
      b.type === "request"
        ? new Date(b.data.app_requests.updatedAt).getTime()
        : new Date(b.data.spans[0].start_time).getTime();
    return bTime - aTime; // Sort in descending order (most recent first)
  });
}

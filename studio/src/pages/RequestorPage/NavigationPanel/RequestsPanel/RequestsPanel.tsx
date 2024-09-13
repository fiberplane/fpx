import { RequestMethod } from "@/components/Timeline";
import { Input } from "@/components/ui/input";
import { Status } from "@/components/ui/status";
import { useInputFocusDetection } from "@/hooks";
import { useOtelTraces } from "@/queries";
import {
  cn,
  getRequestMethod,
  getRequestPath,
  getRequestUrl,
  getStatusCode,
} from "@/utils";
import type { OtelTrace } from "@fiberplane/fpx-types";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import type { Requestornator } from "../../queries";
import { useRequestorStore, useServiceBaseUrl } from "../../store";
import { useRequestorHistory } from "../../useRequestorHistory";

export function RequestsPanel() {
  const { history } = useRequestorHistory();
  const { data: traces = [] } = useOtelTraces();
  const items = useMemo(() => mergeLists(history, traces), [history, traces]);

  const [filterValue, setFilterValue] = useState("");
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (item.type === "request") {
        return item.data.app_requests.requestUrl.includes(filterValue);
      }
      return item.data.spans.some((span) =>
        getRequestPath(span).includes(filterValue),
      );
    });
  }, [items, filterValue]);

  const { activeHistoryResponseTraceId } = useRequestorStore(
    "activeHistoryResponseTraceId",
  );
  const { id = activeHistoryResponseTraceId } = useParams();

  const activeIndex = useMemo(() => {
    return filteredItems.findIndex((item) => getId(item) === id);
  }, [filteredItems, id]);

  const [selectedItemId, setSelectedItemId] = useState<string | null>(() => {
    return activeIndex !== -1 ? getId(filteredItems[activeIndex]) : null;
  });

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);

  const handleItemSelect = useCallback(
    (item: MergedListItem) => {
      navigate({
        pathname: `/${item.type}/${getId(item)}`,
        search: searchParams.toString(),
      });
    },
    [navigate, searchParams],
  );

  const { isInputFocused, blurActiveInput } = useInputFocusDetection();

  const getNextItemIndex = (currentIndex: number, direction: 1 | -1) => {
    let nextIndex = currentIndex + direction;
    if (nextIndex < 0) {
      nextIndex = filteredItems.length - 1;
    } else if (nextIndex >= filteredItems.length) {
      nextIndex = 0;
    }
    return nextIndex;
  };

  useHotkeys(["j", "k", "/"], (event) => {
    event.preventDefault();
    switch (event.key) {
      case "j":
        setSelectedItemId((prevId) => {
          const currentIndex = filteredItems.findIndex(
            (item) => getId(item) === prevId,
          );
          const nextIndex = getNextItemIndex(currentIndex, 1);
          return getId(filteredItems[nextIndex]);
        });
        break;
      case "k":
        setSelectedItemId((prevId) => {
          const currentIndex = filteredItems.findIndex(
            (item) => getId(item) === prevId,
          );
          const nextIndex = getNextItemIndex(currentIndex, -1);
          return getId(filteredItems[nextIndex]);
        });
        break;
      case "/": {
        if (searchRef.current) {
          searchRef.current.focus();
          setSelectedItemId(null);
        }
        break;
      }
    }
  });

  useHotkeys(
    ["Escape", "Enter"],
    (event) => {
      switch (event.key) {
        case "Enter": {
          if (isInputFocused && filteredItems.length > 0) {
            setSelectedItemId(getId(filteredItems[0]));
            const firstItemElement = document.getElementById(
              `item-${getId(filteredItems[0])}`,
            );
            if (firstItemElement) {
              firstItemElement.focus();
            }
            break;
          }

          if (selectedItemId !== null) {
            const selectedItem = filteredItems.find(
              (item) => getId(item) === selectedItemId,
            );
            if (selectedItem) {
              handleItemSelect(selectedItem);
            }
          }
          break;
        }

        case "Escape": {
          if (isInputFocused) {
            blurActiveInput();
            break;
          }
          if (filterValue) {
            setFilterValue("");
            break;
          }

          setSelectedItemId(id);
          break;
        }
      }
    },
    { enableOnFormTags: ["input"] },
  );

  return (
    <div className="grid grid-rows-[min-content_auto] h-full gap-7">
      <div className="flex items-center space-x-2 pb-3">
        <Input
          ref={searchRef}
          className="text-sm"
          placeholder={`Search requests (hit "/" to focus)`}
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
        />
      </div>
      <div className="overflow-y-auto relative">
        {filteredItems.length === 0 && (
          <div className="flex items-center justify-center h-full w-full">
            <p className="text-sm text-muted-foreground">No requests found</p>
          </div>
        )}
        {filteredItems.map((item) => (
          <NavItem
            key={getId(item)}
            item={item}
            isSelected={getId(item) === selectedItemId}
            onSelect={() => handleItemSelect(item)}
            searchParams={searchParams}
          />
        ))}
      </div>
    </div>
  );
}

type NavItemProps = {
  item: MergedListItem;
  isSelected: boolean;
  onSelect: () => void;
  searchParams: URLSearchParams;
};

const NavItem = memo(
  ({ item, isSelected, onSelect, searchParams }: NavItemProps) => {
    const { activeHistoryResponseTraceId } = useRequestorStore(
      "activeHistoryResponseTraceId",
    );
    const { id = activeHistoryResponseTraceId } = useParams();
    const itemRef = useRef<HTMLAnchorElement>(null);

    useEffect(() => {
      if (isSelected && itemRef.current) {
        itemRef.current.focus();
      }
    }, [isSelected]);

    return (
      <Link
        ref={itemRef}
        to={{
          pathname: `/${item.type}/${getId(item)}`,
          search: searchParams.toString(),
        }}
        className={cn(
          "grid grid-cols-[38px_38px_1fr] gap-2 hover:bg-muted px-2 py-1 rounded cursor-pointer items-center",
          "focus:outline-none",
          {
            "bg-muted": id === getId(item),
            "hover:bg-muted": id !== getId(item),
            "focus:ring-1 bg-muted focus:ring-blue-500 focus:ring-opacity-25 focus:ring-inset":
              id !== getId(item) && isSelected,
          },
        )}
        onClick={(e: React.MouseEvent) => {
          e.preventDefault();
          onSelect();
        }}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSelect();
          }
        }}
        data-state-active={id === getId(item)}
        data-state-selected={isSelected}
        id={`item-${getId(item)}`}
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
  },
);

const getId = (item: MergedListItem) => {
  return item.type === "request"
    ? item.data.app_responses.traceId
    : item.data.traceId;
};

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

  return (
    <div className="text-sm font-mono overflow-hidden text-ellipsis whitespace-nowrap">
      {path}
    </div>
  );
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
  return <RequestMethod method={method} className="text-xs font-mono" />;
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

import { RequestMethod } from "@/components/Timeline";
import { Status } from "@/components/ui/status";
import { useInputFocusDetection } from "@/hooks";
import { useActiveTraceId } from "@/hooks";
import { useOtelTraces } from "@/queries";
import {
  cn,
  getRequestMethod,
  getRequestPath,
  getRequestUrl,
  getStatusCode,
} from "@/utils";
import type { OtelTrace } from "@fiberplane/fpx-types";
import { Icon } from "@iconify/react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import type { Requestornator } from "../../queries";
import { useServiceBaseUrl } from "../../store";
import { useRequestorHistory } from "../../useRequestorHistory";
import { Search } from "../Search";

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

  const id = useActiveTraceId();

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
    <div className={cn("h-full", "flex", "flex-col")}>
      <div>
        <div className="flex items-center space-x-2 pb-3">
          <Search
            ref={searchRef}
            value={filterValue}
            onChange={setFilterValue}
            onFocus={() => {
              setSelectedItemId(null);
            }}
            placeholder="requests"
            onItemSelect={() => {}}
            itemCount={filteredItems.length}
          />
        </div>
      </div>
      <div className="overflow-y-auto h-full relative">
        {filteredItems.length === 0 && <EmptyState />}
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-gray-300 h-full">
      <div className="py-8 px-2 rounded-lg flex flex-col items-center text-center">
        <div className="rounded-lg p-2 bg-muted mb-2">
          <Icon
            icon="lucide:clock"
            className="w-12 h-12 text-gray-400 stroke-1"
          />
        </div>
        <h2 className="text-lg font-normal mb-4">No requests recorded</h2>
        <div className="text-gray-400 text-left text-sm flex flex-col gap-4">
          <ol className="flex flex-col gap-2">
            <li>
              1. Make sure your app is running and connected to the Fiberplane
              Studio using the client library
            </li>
            <li className="mt-2">
              2. Send an API request to one your app's endpoints
            </li>
            <li className="mt-2">3. Requests will appear here automatically</li>
          </ol>
          <p className="text-gray-400 text-sm">
            If requests are still not appearing:
          </p>
          <ul className="text-left text-sm text-gray-400">
            <li>
              - Ask for help on{" "}
              <a
                href="https://discord.com/invite/cqdY6SpfVR"
                className="underline"
              >
                Discord
              </a>
            </li>
            <li>
              - File an issue on{" "}
              <a
                href="https://github.com/fiberplane/fpx/issues"
                className="underline"
              >
                Github
              </a>
            </li>
          </ul>
        </div>
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
    const id = useActiveTraceId();
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

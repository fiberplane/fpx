import { RequestMethod } from "@/components/Timeline";
import { Status } from "@/components/ui/status";
import { useInputFocusDetection } from "@/hooks";
import { useActiveTraceId } from "@/hooks";
import { cn } from "@/utils";
import { Icon } from "@iconify/react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Link, type To, useNavigate, useSearchParams } from "react-router-dom";
import type { ProxiedRequestResponse } from "../../queries";
import { useServiceBaseUrl } from "../../store";
import { useRequestorHistory } from "../../useRequestorHistory";
import { Search } from "../Search";

export function RequestsPanel() {
  const { history: items } = useRequestorHistory();

  const [filterValue, setFilterValue] = useState("");
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      return item.app_requests.requestUrl.includes(filterValue);
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
    (item: ProxiedRequestResponse) => {
      navigate({
        pathname: `/request/${getId(item)}`,
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
            searchParams={searchParams}
            to={{
              pathname: `/request/${getId(item)}`,
              search: searchParams.toString(),
            }}
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
  item: ProxiedRequestResponse;
  isSelected: boolean;
  to: To;
  searchParams: URLSearchParams;
};

const NavItem = memo(({ to, item, isSelected }: NavItemProps) => {
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
      to={to}
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
      onKeyDown={(e: React.KeyboardEvent<HTMLAnchorElement>) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.click();
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
});

const getId = (item: ProxiedRequestResponse) => {
  return item.app_responses?.traceId || item.app_requests.id.toString();
};

const PathCell = ({ item }: { item: ProxiedRequestResponse }) => {
  const { removeServiceUrlFromPath } = useServiceBaseUrl();
  const path = removeServiceUrlFromPath(item.app_requests.requestUrl);

  return (
    <div className="text-sm font-mono overflow-hidden text-ellipsis whitespace-nowrap">
      {path}
    </div>
  );
};

const StatusCell = ({ item }: { item: ProxiedRequestResponse }) => {
  const code = Number.parseInt(item.app_responses?.responseStatusCode);

  return <Status statusCode={code} />;
};

const MethodCell = ({ item }: { item: ProxiedRequestResponse }) => {
  const method = item.app_requests.requestMethod;
  return <RequestMethod method={method} className="text-xs font-mono" />;
};

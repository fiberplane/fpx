import { REQUESTOR_TRACE_ROUTE } from "@/constants";
import { useInputFocusDetection } from "@/hooks";
import { useActiveTraceId } from "@/hooks";
import { cn } from "@/utils";
import { useCallback, useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { generatePath, useNavigate, useSearchParams } from "react-router-dom";
import type { ProxiedRequestResponse } from "../../queries";
import { useRequestorHistory } from "../../useRequestorHistory";
import { Search } from "../Search";
import { EmptyState } from "./EmptyState";
import { NavItem } from "./NavItem";
import { getId } from "./util";

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
        pathname: generatePath(REQUESTOR_TRACE_ROUTE, { traceId: getId(item) }),
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

          setSelectedItemId(id ?? null);
          break;
        }
      }
    },
    { enableOnFormTags: ["input"] },
  );

  return (
    <div className={cn("h-full flex flex-col min-w-0")}>
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
      <div className="overflow-y-auto overflow-x-hidden h-full relative flex flex-col justify-start">
        {" "}
        {filteredItems.length === 0 && <EmptyState />}
        {filteredItems.length === 0 ? (
          <EmptyState />
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}

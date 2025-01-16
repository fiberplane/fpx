import { RequestMethod } from "@/components/Timeline";
import { Status } from "@/components/ui/status";
import { useActiveTraceId } from "@/hooks";
import { cn } from "@/utils";
import { memo, useEffect, useRef } from "react";
import { Link, type To } from "react-router-dom";
import type { ProxiedRequestResponse } from "../../queries";
import { useServiceBaseUrl } from "../../store";
import { getId } from "./util";

type NavItemProps = {
  item: ProxiedRequestResponse;
  isSelected: boolean;
  to: To;
  searchParams: URLSearchParams;
};
export const NavItem = memo(({ to, item, isSelected }: NavItemProps) => {
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
        "w-full",
        "h-fit min-w-0",
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
      <PathCell item={item} />
    </Link>
  );
});

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

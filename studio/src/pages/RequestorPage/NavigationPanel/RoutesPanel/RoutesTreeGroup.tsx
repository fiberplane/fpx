import { cn } from "@/utils";
import { ChevronDownIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { type ReactNode, memo, useState } from "react";

type RoutesTreeGroupProps = {
  children: ReactNode;
  filePath: string;
  level?: number;
};

export const RoutesTreeGroup = memo(function RoutesTreeGroup({
  children,
  filePath,
  level = 0,
}: RoutesTreeGroupProps) {
  const [collapsed, setCollapsed] = useState(false);
  const toggleCollapsed = () => setCollapsed((current) => !current);

  return (
    <div className={"pt-2 grid min-w-0"}>
      <button
        type="button"
        className={cn(
          "grid px-1 grid-cols-[24px_auto] items-center",
          "px-1",
          "rounded text-left",
          "text-muted-foreground hover:bg-muted",
        )}
        onClick={toggleCollapsed}
      >
        <span className="">
          {!collapsed ? <ChevronDownIcon /> : <ChevronRightIcon />}
        </span>
        <div className="font-medium font-mono text-xs leading-6">
          {filePath}
        </div>
      </button>
      {!collapsed && (
        <div
          className={cn({
            "ml-[10px] ": level > 0,
            "pl-[10px]": true,
            "border-l border-l-input": level > 0,
          })}
        >
          {children}
        </div>
      )}
    </div>
  );
});
